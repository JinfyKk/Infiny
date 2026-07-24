import { EventEmitter } from 'events'
import { spawn, ChildProcess, SpawnOptions } from 'child_process'

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
          this.emit(
            'process-output',
            name,
            data.toString()
          )
        }
      )


      child.stderr?.on(
        'data',
        (data: Buffer) => {
          this.emit(
            'process-output',
            name,
            data.toString()
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
            '[ProcessManager] closed:',
            name,
            code
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

    // Marca como parada intencional para não disparar auto-restart.
    this.intentionalStops.add(name)

    this.clearHealthCheck(name)


    const child = info.process


    return new Promise(resolve => {

      const timer = setTimeout(() => {

        if (!child.killed) {
          child.kill('SIGKILL')
        }

      }, forceTimeoutMs)


      child.once(
        'close',
        code => {

          clearTimeout(timer)

          this.handleProcessExit(
            name,
            code
          )

          resolve()
        }
      )


       child.kill(signal)

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
   * Escreve dados no stdin de um processo (ex.: enviar mensagem NDJSON pro Claude CLI).
   * Retorna false se o processo não existir, não estiver rodando, ou o stdin não for gravável.
   */
  writeToProcess(name: string, data: string): boolean {
    const info = this.processes.get(name)

    if (!info || !info.process || info.status !== 'running') {
      return false
    }

    const stdin = info.process.stdin

    if (!stdin || !stdin.writable) {
      return false
    }

    try {
      return stdin.write(data)
    } catch (error) {
      console.error(
        `[ProcessManager] writeToProcess falhou: ${name}`,
        error
      )
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