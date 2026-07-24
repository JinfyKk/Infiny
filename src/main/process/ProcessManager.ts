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
  'status-changed': [processName: string, status: ProcessInfo['status'], details?: string]
}

/**
 * ProcessManager - Gerenciador genérico de processos filhos.
 *
 * Responsabilidades:
 * - Spawn/stop/restart de processos nomeados
 * - Tracking de estado por nome de processo
 * - Encaminhamento de stdout/stderr/events
 * - Health checks opcionais por processo
 * - Auto-restart com backoff exponencial (configurável por processo)
 *
 * NÃO conhece: fcc-server, claude, providers, proxies, models.
 * Apenas gerencia processos filhos genéricos.
 */
export class ProcessManager extends EventEmitter {
  private processes: Map<string, ProcessInfo> = new Map()
  private healthChecks: Map<string, { timer: NodeJS.Timeout; config: HealthCheckConfig }> = new Map()
  private restartConfigs: Map<string, { maxAttempts: number; backoffMs: number; attempts: number }> = new Map()
  private isShuttingDown = false

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Inicia um novo processo nomeado.
   * Se já existir processo com mesmo nome, para o anterior primeiro.
   */
  async spawn(
    name: string,
    command: string,
    args: string[],
    options: SpawnOptions = {},
    healthCheck?: HealthCheckConfig
  ): Promise<ChildProcess> {
    console.log('[DEBUG] [ProcessManager] spawn() - START, name:', name, 'command:', command)
    // Parar processo existente com mesmo nome
    if (this.processes.has(name)) {
      console.log('[DEBUG] [ProcessManager] spawn() - stopping existing process:', name)
      await this.stop(name)
    }

    const info: ProcessInfo = {
      name,
      process: null as any,
      command,
      args,
      options,
      startedAt: Date.now(),
      status: 'starting',
    }

    this.processes.set(name, info)
    this.emit('status-changed', name, 'starting', `Iniciando ${command} ${args.join(' ')}`)

    return new Promise((resolve, reject) => {
      try {
        console.log('[DEBUG] [ProcessManager] spawn() - calling child_process.spawn')
        const child = spawn(command, args, {
          ...options,
          windowsHide: options.windowsHide ?? true,
        })

        console.log('[DEBUG] [ProcessManager] spawn() - spawn returned, pid:', child.pid)

        info.process = child
        info.status = 'running'
        this.emit('status-changed', name, 'running', 'Processo iniciado')
        this.emit('process-started', info)

        // Setup stdout/stderr forwarding
        child.stdout?.on('data', (data: Buffer) => {
          const output = data.toString()
          this.emit('process-output', name, output)
        })

        child.stderr?.on('data', (data: Buffer) => {
          const error = data.toString()
          this.emit('process-output', name, error) // stderr também vai para output
        })

        child.on('error', (err: NodeJS.ErrnoException) => {
          console.log('[DEBUG] [ProcessManager] spawn() - child.on(error):', err.message, 'code:', err.code)
          info.status = 'error'
          info.error = err.message
          this.emit('process-error', info, err)
          this.emit('status-changed', name, 'error', err.message)

          // Erros de spawn fatais significam que o processo NUNCA chegou a
          // nascer (ex: ENOENT = comando não existe, EACCES = sem permissão,
          // ENOEXEC = arquivo não-executável). Reiniciar nesses casos é inútil:
          // é sempre o mesmo comando inválido, então vai falhar exatamente
          // igual em toda tentativa. Isso é erro de configuração, não crash
          // transitório — não deve entrar no ciclo de auto-restart.
          const fatalSpawnErrors = ['ENOENT', 'EACCES', 'ENOEXEC']
          if (err.code && fatalSpawnErrors.includes(err.code)) {
            console.error(
              `[ProcessManager] Erro fatal de spawn para "${name}" (${err.code}): ` +
              `o comando "${info.command}" não pôde ser executado. Auto-restart ` +
              `desabilitado para este erro — corrija o comando/caminho do executável.`
            )
            this.handleFatalSpawnError(name)
          } else {
            this.handleProcessExit(name, -1)
          }

          reject(err)
        })

        child.on('close', (code: number | null) => {
          console.log('[DEBUG] [ProcessManager] spawn() - child.on(close):', code)
          this.handleProcessExit(name, code)
        })

        // Health check opcional
        if (healthCheck) {
          console.log('[DEBUG] [ProcessManager] spawn() - setting up health check for:', name)
          this.setupHealthCheck(name, healthCheck)
        }

        console.log('[DEBUG] [ProcessManager] spawn() - resolving promise')
        resolve(child)
      } catch (err) {
        console.log('[DEBUG] [ProcessManager] spawn() - catch block:', err)
        info.status = 'error'
        info.error = err instanceof Error ? err.message : String(err)
        this.emit('status-changed', name, 'error', info.error)
        this.processes.delete(name)
        reject(err)
      }
    })
  }

  /**
   * Para um processo pelo nome.
   */
  async stop(name: string, signal: NodeJS.Signals = 'SIGINT', forceTimeoutMs = 3000): Promise<void> {
    const info = this.processes.get(name)
    if (!info || !info.process) {
      return
    }

    this.emit('status-changed', name, 'stopped', 'Parando processo')

    // Cleanup health check
    this.clearHealthCheck(name)

    const child = info.process
    info.status = 'stopped'

    return new Promise((resolve) => {
      const forceKill = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL')
        }
      }, forceTimeoutMs)

      child.once('close', (code: number | null) => {
        clearTimeout(forceKill)
        this.handleProcessExit(name, code)
        resolve()
      })

      child.kill(signal)
    })
  }

  /**
   * Reinicia um processo usando a mesma configuração original.
   */
  async restart(name: string): Promise<ChildProcess | null> {
    const info = this.processes.get(name)
    if (!info) {
      console.warn(`[ProcessManager] Processo "${name}" não encontrado para restart`)
      return null
    }

    const restartConfig = this.restartConfigs.get(name)
    const attempt = (restartConfig?.attempts ?? 0) + 1
    const maxAttempts = restartConfig?.maxAttempts ?? 3
    const backoffMs = restartConfig?.backoffMs ?? 2000

    if (attempt > maxAttempts) {
      this.emit('status-changed', name, 'error', `Máximo de tentativas de restart atingido (${maxAttempts})`)
      return null
    }

    this.emit('process-restarting', name, attempt)
    this.emit('status-changed', name, 'starting', `Reiniciando (tentativa ${attempt}/${maxAttempts})`)

    if (restartConfig) {
      restartConfig.attempts = attempt
    }

    const delay = backoffMs * Math.pow(2, attempt - 1)
    await new Promise((r) => setTimeout(r, delay))

    try {
      const child = await this.spawn(name, info.command, info.args, info.options)
      if (restartConfig) {
        restartConfig.attempts = 0 // Reset on success
      }
      return child
    } catch (error) {
      console.error(`[ProcessManager] Restart falhou para "${name}":`, error)
      return this.restart(name) // Tentar novamente (recursivo com backoff)
    }
  }

  /**
   * Configura auto-restart para um processo.
   */
  configureRestart(name: string, maxAttempts: number, backoffMs: number): void {
    this.restartConfigs.set(name, { maxAttempts, backoffMs, attempts: 0 })
  }

  /**
   * Obtém informações de um processo.
   */
  get(name: string): ProcessInfo | undefined {
    return this.processes.get(name)
  }

  /**
   * Verifica se um processo está rodando.
   */
  isRunning(name: string): boolean {
    const info = this.processes.get(name)
    return info?.status === 'running' && info.process !== null && !info.process.killed
  }

  /**
   * Lista todos os processos gerenciados.
   */
  list(): ProcessInfo[] {
    return Array.from(this.processes.values())
  }

  /**
   * Obtém o processo filho bruto (para stdin.write, etc).
   */
  getProcess(name: string): ChildProcess | null {
    return this.processes.get(name)?.process ?? null
  }

  /**
   * Escreve no stdin de um processo.
   */
  writeToProcess(name: string, data: string): boolean {
    const child = this.getProcess(name)
    if (!child || !child.stdin?.writable) {
      return false
    }
    try {
      child.stdin.write(data)
      return true
    } catch {
      return false
    }
  }

  /**
   * Para todos os processos e limpa recursos.
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true

    // Parar todos os health checks
    for (const name of this.healthChecks.keys()) {
      this.clearHealthCheck(name)
    }

    // Parar todos os processos
    const names = Array.from(this.processes.keys())
    await Promise.all(names.map((name) => this.stop(name)))

    this.processes.clear()
    this.restartConfigs.clear()
    console.log('[ProcessManager] Shutdown completo')
  }

  // ============================================
  // INTERNAL
  // ============================================

  /**
   * Lida com erro fatal de spawn (ENOENT, EACCES, ENOEXEC): o processo nunca
   * chegou a existir, então não há "exit code" nem "processo rodando" a
   * encerrar. Diferente de handleProcessExit(), aqui NUNCA agendamos restart
   * — removemos o processo e a config de restart definitivamente, e deixamos
   * o status como 'error' para quem estiver ouvindo 'status-changed' saber
   * que precisa de intervenção manual (corrigir comando/caminho), não de
   * mais tentativas automáticas.
   */
  private handleFatalSpawnError(name: string): void {
    this.processes.delete(name)
    this.restartConfigs.delete(name)
    this.clearHealthCheck(name)
  }

  private handleProcessExit(name: string, code: number | null): void {
    const info = this.processes.get(name)
    if (!info) return

    info.status = 'stopped'
    this.emit('process-stopped', info, code)
    this.emit('status-changed', name, 'stopped', `Exit code: ${code ?? 'signal'}`)

    // Auto-restart se configurado e não foi shutdown intencional
    const restartConfig = this.restartConfigs.get(name)
    if (restartConfig && !this.isShuttingDown && code !== 0) {
      console.log(`[ProcessManager] Processo "${name}" saiu com código ${code}, agendando restart...`)
      this.restart(name)
    } else {
      this.processes.delete(name)
      this.restartConfigs.delete(name)
    }
  }

  private setupHealthCheck(name: string, config: HealthCheckConfig): void {
    this.clearHealthCheck(name)

    const timer = setInterval(async () => {
      try {
        const healthy = await config.check()
        if (!healthy) {
          console.warn(`[ProcessManager] Health check falhou para "${name}"`)
          config.onFailure?.(name)
        }
      } catch (error) {
        console.warn(`[ProcessManager] Health check erro para "${name}":`, error)
        config.onFailure?.(name)
      }
    }, config.intervalMs)

    this.healthChecks.set(name, { timer, config })
  }

  private clearHealthCheck(name: string): void {
    const hc = this.healthChecks.get(name)
    if (hc) {
      clearInterval(hc.timer)
      this.healthChecks.delete(name)
    }
  }
}

// Tipo para eventos tipados
export type ProcessManagerEventMap = {
  'process-started': [info: ProcessInfo]
  'process-stopped': [info: ProcessInfo, code: number | null]
  'process-error': [info: ProcessInfo, error: Error]
  'process-output': [processName: string, output: string]
  'process-restarting': [processName: string, attempt: number]
  'status-changed': [processName: string, status: ProcessInfo['status'], details?: string]
}