import { EventEmitter } from 'events'
import { spawn, ChildProcess, SpawnOptions, exec } from 'child_process'

export interface ProcessInfo {
  name: string
  process: ChildProcess
  command: string
  args: string[]
  options: SpawnOptions
  startedAt: number
  status: 'starting' | 'running' | 'stopped' | 'error'
  error?: string
}

export interface HealthCheckConfig {
  intervalMs: number
  check: () => Promise<boolean>
  onFailure?: (processName: string) => void
  // Configuração de retry para health check único (usado por isHealthy)
  singleCheckRetries?: number
  singleCheckDelayMs?: number
}

export interface ProcessManagerEvents {
  'process-started': [info: ProcessInfo]
  'process-stopped': [info: ProcessInfo, code: number | null]
  'process-error': [info: ProcessInfo, error: Error]
  'process-output': [processName: string, output: string]
  'process-restarting': [processName: string, attempt: number]
  'status-changed': [
    processName: string,
    status: ProcessInfo['status'],
    details?: string
  ]
}

interface RestartPolicy {
  maxRetries: number
  delayMs: number
  attempts: number
}

interface SpawnParams {
  command: string
  args: string[]
  options: SpawnOptions
  healthCheck?: HealthCheckConfig
}

/**
 * Gerenciador genérico de processos.
 *
 * NÃO conhece providers.
 * NÃO conhece Claude.
 * NÃO conhece fcc-server.
 *
 * Apenas gerencia processos filhos.
 */
export class ProcessManager extends EventEmitter {
  private processes = new Map<string, ProcessInfo>()

  private healthChecks = new Map<
    string,
    {
      timer: NodeJS.Timeout
      config: HealthCheckConfig
    }
  >()

  // Buffer de saída para capturar stdout/stderr completo (útil para debug de falhas)
  private outputBuffers = new Map<string, { stdout: string[]; stderr: string[] }>()

  // Guarda os últimos parâmetros usados no spawn() de cada processo,
  // para permitir restart() sem que o chamador precise repassar tudo de novo.
  private spawnParams = new Map<string, SpawnParams>()

  // Política de auto-restart configurada via configureRestart().
  private restartPolicies = new Map<string, RestartPolicy>()

  // Nomes de processos que foram parados intencionalmente via stop(),
  // para não disparar auto-restart nesses casos.
  private intentionalStops = new Set<string>()

  async spawn(
    name: string,
    command: string,
    args: string[],
    options: SpawnOptions = {},
    healthCheck?: HealthCheckConfig
  ): Promise<ChildProcess> {

    console.log(
      '[ProcessManager] spawn:',
      name,
      command,
      args.join(' ')
    )


    if (this.processes.has(name)) {
      await this.stop(name)
    }

    // Guarda os parâmetros para permitir restart() futuramente.
    this.spawnParams.set(name, { command, args, options, healthCheck })
    this.intentionalStops.delete(name)


    const info: ProcessInfo = {
      name,
      process: null as any,
      command,
      args,
      options,
      startedAt: Date.now(),
      status: 'starting'
    }


    this.processes.set(name, info)


    // Inicializar buffer de saída para capturar stdout/stderr completo
    this.outputBuffers.set(name, { stdout: [], stderr: [] })


    this.emit(
      'status-changed',
      name,
      'starting',
      `Iniciando ${command}`
    )


    return new Promise((resolve, reject) => {

      let spawned = false


      const child = spawn(command, args, {
        ...options,
        windowsHide: options.windowsHide ?? true
      })


      info.process = child


      /*
       * IMPORTANTE:
       * spawn() retornar não significa que iniciou.
       *
       * O evento "spawn" confirma que o processo realmente nasceu.
       */
      child.once('spawn', () => {

        spawned = true

        info.status = 'running'


        this.emit(
          'status-changed',
          name,
          'running',
          'Processo iniciado'
        )


        this.emit(
          'process-started',
          info
        )


        resolve(child)
      })


      child.stdout?.on(
        'data',
        (data: Buffer) => {
          const output = data.toString()
          // Buffer completo para debug de falhas
          const buffer = this.outputBuffers.get(name)
          if (buffer) {
            buffer.stdout.push(output)
          }
          console.log('[ProcessManager] [Pipeline] stdout DATA', { name, outputPreview: output.slice(0, 200) })
          this.emit(
            'process-output',
            name,
            output
          )
        }
      )


      child.stderr?.on(
        'data',
        (data: Buffer) => {
          const output = data.toString()
          // Buffer completo para debug de falhas
          const buffer = this.outputBuffers.get(name)
          if (buffer) {
            buffer.stderr.push(output)
          }
          console.warn('[ProcessManager] [Pipeline] stderr DATA', { name, outputPreview: output.slice(0, 200) })
          this.emit(
            'process-output',
            name,
            output
          )
        }
      )


      child.on(
        'error',
        (err: NodeJS.ErrnoException) => {

          console.error(
            '[ProcessManager] spawn error:',
            err.code,
            err.message
          )


          info.status = 'error'
          info.error = err.message


          this.emit(
            'process-error',
            info,
            err
          )


          this.emit(
            'status-changed',
            name,
            'error',
            err.message
          )


          const fatalErrors = [
            'ENOENT',
            'EACCES',
            'ENOEXEC'
          ]


          if (
            err.code &&
            fatalErrors.includes(err.code)
          ) {

            this.handleFatalSpawnError(
              name,
              err.message
            )

          } else {

            this.handleProcessExit(
              name,
              -1
            )

          }


          /*
           * Se spawn falhou antes do processo existir,
           * rejeita a Promise.
           */
          if (!spawned) {
            reject(err)
          }
        }
      )


      child.on(
        'close',
        (code) => {

          console.log(
            '[ProcessManager] [Pipeline] PROCESS CLOSED',
            name,
            { code, signal: undefined }
          )


          this.handleProcessExit(
            name,
            code
          )
        }
      )


      if (healthCheck) {
        this.setupHealthCheck(
          name,
          healthCheck
        )
      }

    })
  }


  async stop(
    name: string,
    signal: NodeJS.Signals = 'SIGINT',
    forceTimeoutMs = 3000
  ): Promise<void> {

    const info = this.processes.get(name)

    if (!info || !info.process) {
      return
    }

    const child = info.process

    // FIX (deadlock): o Map `this.processes` não é limpo quando um processo
    // morre — só o `status` é atualizado (ver handleProcessExit). Isso faz
    // com que, ao chamar spawn() de novo pro mesmo `name` (ex.: trocar de
    // projeto), o `if (this.processes.has(name)) await this.stop(name)`
    // encontre essa entrada obsoleta, cujo `child` já teve seu evento
    // 'close' disparado uma única vez no passado. Um `child.once('close', ...)`
    // registrado DEPOIS que 'close' já disparou nunca é chamado de novo —
    // o evento não "replaya". Sem essa guarda, a Promise abaixo nunca
    // resolvia (o fallback de timeout só reenvia taskkill, não dá resolve()),
    // travando o await para sempre e nunca chegando nas linhas seguintes de
    // spawn() (por isso o log sempre parava logo após "spawn: fcc-server").
    // `exitCode`/`signalCode` só deixam de ser null depois que o processo
    // já terminou de verdade — se qualquer um dos dois já estiver setado,
    // não há nada pra esperar.
    if (child.exitCode !== null || child.signalCode !== null) {
      this.intentionalStops.delete(name)
      return
    }

    // Marca como parada intencional para não disparar auto-restart.
    this.intentionalStops.add(name)

    this.clearHealthCheck(name)


    const pid = child.pid


    return new Promise(resolve => {

      const timer = setTimeout(() => {

        if (!child.killed) {
          if (process.platform === 'win32' && pid) {
            // Fallback de força bruta: mata a árvore inteira de processos
            // pelo PID. Cobre casos em que o processo (ou algum ancestral
            // dele, ex.: um cmd.exe intermediário) não respondeu ao kill
            // normal e ainda tem filhos vivos segurando recursos (ex.:
            // uma porta TCP).
            exec(`taskkill /PID ${pid} /T /F`)
          } else {
            child.kill('SIGKILL')
          }
        }

      }, forceTimeoutMs)


      child.once(
        'close',
        () => {

          clearTimeout(timer)

          // NÃO chame handleProcessExit aqui — o handler .on('close') registrado
          // no spawn() já faz isso. Evita double-call que consumiria a flag
          // intentionalStops e dispararia auto-restart indesejado.
          resolve()
        }
      )


      if (process.platform === 'win32' && pid) {
        // No Windows, sinais POSIX (SIGINT/SIGTERM) não existem de verdade.
        // Usamos taskkill /T (árvore) /F (força) direto: isso garante que
        // qualquer processo filho (ex.: quando o processo foi spawnado via
        // shell:true e criou um cmd.exe intermediário) também é encerrado,
        // e não fica órfão segurando portas/handles depois que o app fecha.
        exec(`taskkill /PID ${pid} /T /F`)
      } else {
        child.kill(signal)
      }

    })
  }

  /**
   * Verifica se um processo está rodando no momento.
   */
  isRunning(name: string): boolean {
    const info = this.processes.get(name)
    return !!info && info.status === 'running'
  }

  /**
   * Verifica se um processo existe E está saudável.
   * Roda o health check configurado (com retries) uma única vez.
   * Útil para decidir se deve reusar um servidor existente vs spawnar novo.
   */
  async isHealthy(name: string): Promise<boolean> {
    const info = this.processes.get(name)

    if (!info || !info.process || info.status !== 'running') {
      return false
    }

    const healthCheck = this.healthChecks.get(name)
    if (!healthCheck) {
      // Sem health check configurado, considera saudável se está running
      return true
    }

    const config = healthCheck.config
    const retries = config.singleCheckRetries ?? 3
    const delayMs = config.singleCheckDelayMs ?? 500

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const healthy = await config.check()
        if (healthy) {
          console.log('[ProcessManager] isHealthy: process', name, 'is healthy (attempt', attempt, ')')
          return true
        }
        console.log('[ProcessManager] isHealthy: process', name, 'health check failed (attempt', attempt, ')')
      } catch (err) {
        console.log('[ProcessManager] isHealthy: process', name, 'health check error (attempt', attempt, '):', err instanceof Error ? err.message : String(err))
      }

      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }

    console.warn('[ProcessManager] isHealthy: process', name, 'UNHEALTHY after', retries, 'attempts')
    return false
  }

  /**
   * Escreve dados no stdin de um processo (ex.: enviar mensagem NDJSON pro Claude CLI).
   * Retorna false se o processo não existir, não estiver rodando, ou o stdin não for gravável.
   */
  writeToProcess(name: string, data: string): boolean {
    const info = this.processes.get(name)

    console.log('[ProcessManager] [Pipeline] writeToProcess CALLED', {
      name,
      dataLength: data.length,
      hasInfo: !!info,
      processExists: !!info?.process,
      processStatus: info?.status,
      stdinExists: !!info?.process?.stdin,
      stdinWritable: !!info?.process?.stdin?.writable
    })

    if (!info || !info.process || info.status !== 'running') {
      console.warn('[ProcessManager] [Pipeline] writeToProcess FAILED: Process not running', {
        name,
        hasInfo: !!info,
        processExists: !!info?.process,
        status: info?.status
      })
      return false
    }

    const stdin = info.process.stdin

    if (!stdin || !stdin.writable) {
      console.warn('[ProcessManager] [Pipeline] writeToProcess FAILED: stdin not writable', {
        name,
        stdinExists: !!stdin,
        stdinWritable: !!stdin?.writable
      })
      return false
    }

    try {
      const bytesWritten = Buffer.byteLength(data, 'utf8')
      const success = stdin.write(data)
      console.log('[ProcessManager] [Pipeline] writeToProcess SUCCESS', {
        name,
        bytesWritten,
        success
      })
      return success
    } catch (error) {
      console.error('[ProcessManager] [Pipeline] writeToProcess ERROR', {
        name,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * Reinicia um processo usando os mesmos parâmetros do último spawn().
   * Usado tanto manualmente (ex.: health check onFailure) quanto pela
   * política de auto-restart configurada via configureRestart().
   */
  async restart(name: string): Promise<void> {
    const params = this.spawnParams.get(name)

    if (!params) {
      throw new Error(
        `[ProcessManager] restart() falhou: nenhum spawn anterior encontrado para "${name}"`
      )
    }

    if (this.isRunning(name)) {
      await this.stop(name)
    }

    await this.spawn(
      name,
      params.command,
      params.args,
      params.options,
      params.healthCheck
    )
  }

  /**
   * Configura a política de auto-restart para um processo: quantas vezes
   * tentar reiniciar automaticamente após uma queda inesperada, e o
   * intervalo base entre tentativas (com backoff linear por tentativa).
   */
  configureRestart(name: string, maxRetries: number, delayMs: number): void {
    this.restartPolicies.set(name, {
      maxRetries,
      delayMs,
      attempts: 0
    })
  }


  private handleProcessExit(
    name: string,
    code: number | null
  ) {
    const info = this.processes.get(name)

    if (!info) {
      return
    }


    info.status = code === 0
      ? 'stopped'
      : 'error'

    // Se o processo terminou com erro (código não-zero), logar stdout/stderr completos para debug
    if (code !== 0) {
      const buffer = this.outputBuffers.get(name)
      if (buffer) {
        const fullStdout = buffer.stdout.join('')
        const fullStderr = buffer.stderr.join('')
        console.error('[ProcessManager] [Pipeline] PROCESS EXIT WITH ERROR - FULL LOGS', {
          name,
          code,
          stdoutLength: fullStdout.length,
          stderrLength: fullStderr.length,
          stdout: fullStdout || '(empty)',
          stderr: fullStderr || '(empty)'
        })
      }
    } else {
      // Limpar buffer em saída limpa
      this.outputBuffers.delete(name)
    }


    this.emit(
      'process-stopped',
      info,
      code
    )


    this.emit(
      'status-changed',
      name,
      info.status,
      `Processo encerrado (${code})`
    )


    this.clearHealthCheck(name)

    this.maybeAutoRestart(name, code)
  }

  /**
   * Se houver uma política de restart configurada para o processo e a
   * queda não foi de um stop() intencional, agenda uma tentativa de
   * restart automático (com backoff linear), respeitando maxRetries.
   */
  private maybeAutoRestart(name: string, code: number | null) {
    const wasIntentional = this.intentionalStops.has(name)
    this.intentionalStops.delete(name)

    if (wasIntentional || code === 0) {
      // Parada intencional ou saída limpa: não reinicia automaticamente.
      const policy = this.restartPolicies.get(name)
      if (policy) {
        policy.attempts = 0
      }
      return
    }

    const policy = this.restartPolicies.get(name)

    if (!policy) {
      return
    }

    if (policy.attempts >= policy.maxRetries) {
      console.warn(
        `[ProcessManager] "${name}" excedeu o número máximo de restarts (${policy.maxRetries})`
      )
      return
    }

    policy.attempts += 1
    const attempt = policy.attempts
    const delay = policy.delayMs * attempt

    this.emit('process-restarting', name, attempt)

    setTimeout(() => {
      this.restart(name).catch((error) => {
        console.error(
          `[ProcessManager] auto-restart falhou para "${name}":`,
          error
        )
      })
    }, delay)
  }


  private setupHealthCheck(
    name: string,
    config: HealthCheckConfig
  ) {
    this.clearHealthCheck(name)


    const timer = setInterval(
      async () => {
        try {
          const healthy = await config.check()

          if (!healthy) {
            console.warn(
              `[ProcessManager] Health check falhou: ${name}`
            )

            config.onFailure?.(name)
          }

        } catch (error) {
          console.error(
            `[ProcessManager] Health check erro: ${name}`,
            error
          )
        }
      },
      config.intervalMs
    )


    this.healthChecks.set(
      name,
      {
        timer,
        config
      }
    )
  }


  private clearHealthCheck(
    name: string
  ) {
    const health = this.healthChecks.get(name)

    if (!health) {
      return
    }


    clearInterval(
      health.timer
    )

    this.healthChecks.delete(name)
  }


  private handleFatalSpawnError(
    name: string,
    message: string
  ) {
    const info = this.processes.get(name)

    if (!info) {
      return
    }


    info.status = 'error'
    info.error = message


    this.emit(
      'process-error',
      info,
      new Error(message)
    )


    this.emit(
      'status-changed',
      name,
      'error',
      message
    )
  }

  /**
   * Para todos os processos gerenciados graciosamente.
   * Limpa health checks e aguarda encerramento.
   * Seguro para chamar múltiplas vezes.
   */
  async shutdown(): Promise<void> {
    console.log('[ProcessManager] Shutting down all processes...')

    // Parar todos os health checks
    for (const [, health] of this.healthChecks) {
      clearInterval(health.timer)
    }
    this.healthChecks.clear()

    // Parar todos os processos
    const stopPromises = Array.from(this.processes.keys()).map(name => this.stop(name))
    await Promise.all(stopPromises)

    this.processes.clear()
    this.spawnParams.clear()
    this.restartPolicies.clear()
    this.intentionalStops.clear()

    console.log('[ProcessManager] Shutdown complete')
  }
}