import { FreeClaudeConfig } from './FreeClaudeConfig'
import { spawn, ChildProcess, SpawnOptions } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Gerencia o ciclo de vida do fcc-server (proxy local do free-claude-code).
 *
 * NOVA ARQUITETURA:
 * - fcc-server NÃO aceita argumentos de configuração (exceto --version).
 * - Toda configuração vem via environment variables carregadas do ~/.config/fcc/.env
 *   pelo Settings do free-claude-code (pydantic-settings).
 * - Fonte: free-claude-code/src/free_claude_code/cli/commands.py:serve()
 *
 * Responsabilidades:
 * - Spawn fcc-server
 * - Health check (HTTP /health ou /v1/models)
 * - Cleanup
 */
export class FCCServerManager {
  private process: ChildProcess | null = null
  private config: FreeClaudeConfig
  private port: number
  private host: string
  private started = false
  private startPromise: Promise<void> | null = null

  constructor(config: FreeClaudeConfig) {
    this.config = { ...config } as FreeClaudeConfig
    this.host = this.config.proxyHost ?? '127.0.0.1'
    this.port = this.config.proxyPort ?? this.findFreePort()
  }

  /**
   * Inicia o fcc-server e aguarda health check.
   * Retorna a URL base do proxy (ex: http://127.0.0.1:8082/v1).
   */
  async start(): Promise<string> {
    // Evita múltiplas inicializações concorrentes
    if (this.startPromise) {
      await this.startPromise
      return this.getBaseUrl()
    }

    this.startPromise = this.doStart()
    await this.startPromise
    return this.getBaseUrl()
  }

  private async doStart(): Promise<void> {
    if (this.process) {
      console.log('[FCCServerManager] Servidor já rodando')
      return
    }

    // 1. Encontrar executável fcc-server
    const fccServerPath = await this.findFCCServerExecutable()
    if (!fccServerPath) {
      throw new Error(
        'fcc-server não encontrado. Instale free-claude-code: `uv tool install free-claude-code` ou `pipx install free-claude-code`'
      )
    }

    // 2. fcc-server NÃO aceita argumentos de configuração
    // Toda configuração vem via environment variables (~/.config/fcc/.env)
    const args: string[] = []

    const options = this.buildSpawnOptions()

    console.log('[FCCServerManager] Iniciando:', fccServerPath, '(no args)')
    console.log('[FCCServerManager] Diretório de trabalho:', options.cwd)

    // 3. Spawn do processo
    this.process = spawn(fccServerPath, args, options)

    // 4. Configurar handlers de saída
    this.setupProcessHandlers()

    // 5. Aguardar health check
    await this.waitForHealthCheck()

    this.started = true
    console.log('[FCCServerManager] Servidor pronto em', this.getBaseUrl())
  }

  /**
   * Encontra o executável fcc-server no sistema.
   */
  private async findFCCServerExecutable(): Promise<string | null> {
    const isWindows = process.platform === 'win32'
    const candidates: string[] = []

    // Caminho customizado na config
    if (this.config.fccServerPath) {
      candidates.push(this.config.fccServerPath)
    }

    // Nomes padrão
    const baseName = isWindows ? 'fcc-server.exe' : 'fcc-server'
    candidates.push(baseName)

    // Caminhos comuns de instalação uv/pipx
    const home = process.env.USERPROFILE || process.env.HOME || ''
    const appData = process.env.APPDATA || ''
    const localAppData = process.env.LOCALAPPDATA || ''

    if (isWindows) {
      candidates.push(
        join(appData, 'uv', 'tools', 'free-claude-code', 'Scripts', 'fcc-server.exe'),
        join(localAppData, 'pipx', 'venvs', 'free-claude-code', 'Scripts', 'fcc-server.exe'),
        join(home, '.local', 'bin', 'fcc-server.exe')
      )
    } else {
      candidates.push(
        join(home, '.local', 'bin', 'fcc-server'),
        join(home, '.cargo', 'bin', 'fcc-server'),
        '/usr/local/bin/fcc-server',
        '/opt/homebrew/bin/fcc-server'
      )
    }

    // Verificar cada candidato
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        console.log('[FCCServerManager] Encontrado fcc-server em:', candidate)
        return candidate
      }
    }

    // Tentar no PATH (spawn com shell)
    console.log('[FCCServerManager] Tentando fcc-server via PATH/shell')
    return baseName
  }

  /**
   * Constrói opções de spawn.
   * SEM variáveis de ambiente FCC_PROVIDER, FCC_API_KEY, etc.
   * O fcc-server lê sua configuração do ~/.config/fcc/.env
   */
  private buildSpawnOptions(): SpawnOptions {
    const isWindows = process.platform === 'win32'
    const useShell = isWindows // Windows precisa shell para resolver .exe no PATH

    return {
      cwd: this.config.projectPath || process.cwd(),
      env: {
        ...process.env,
        // NÃO configurar:
        // FCC_PROVIDER, FCC_API_KEY, FCC_MODEL_MAPPING
        // ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN
        // O fcc-server gerencia tudo internamente via seu .env
      },
      shell: useShell,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'], // stdin ignorado, stdout/stderr capturados
    }
  }

  /**
   * Configura handlers de stdout/stderr/exit do processo do servidor.
   */
  private setupProcessHandlers(): void {
    if (!this.process) return

    this.process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString().trim()
      if (output) {
        console.log('[FCCServerManager stdout]', output)
      }
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      const error = data.toString().trim()
      if (error) {
        console.error('[FCCServerManager stderr]', error)
      }
    })

    this.process.on('close', (code: number | null) => {
      console.log('[FCCServerManager] Servidor encerrado com código:', code)
      this.process = null
      this.started = false
      this.startPromise = null
    })

    this.process.on('error', (err: Error) => {
      console.error('[FCCServerManager] Erro no processo:', err)
      this.process = null
      this.started = false
      this.startPromise = null
    })
  }

  /**
   * Aguarda health check do servidor (HTTP GET /health ou /v1/models).
   */
  private async waitForHealthCheck(): Promise<void> {
    const timeout = this.config.healthCheckTimeout ?? 10000
    const startTime = Date.now()
    const healthUrls = [
      `http://${this.host}:${this.port}/health`,
      `http://${this.host}:${this.port}/v1/models`,
      `http://${this.host}:${this.port}/`,
    ]

    while (Date.now() - startTime < timeout) {
      for (const url of healthUrls) {
        try {
          const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(2000) })
          if (response.ok || response.status === 404) {
            // 404 em /v1/models é OK - significa que servidor responde
            console.log('[FCCServerManager] Health check OK:', url)
            return
          }
        } catch {
          // Ignorar erros de conexão, tentar próximo
        }
      }
      await new Promise((r) => setTimeout(r, 500))
    }

    throw new Error(
      `Timeout aguardando fcc-server ficar pronto (${timeout}ms). ` +
        `Verifique logs em [FCCServerManager stderr]. Porta: ${this.port}`
    )
  }

  /**
   * Encontra porta livre no range 8080-8090.
   * Em produção, deveria verificar disponibilidade real.
   */
  private findFreePort(): number {
    return 8080 + Math.floor(Math.random() * 10)
  }

  /**
   * Retorna URL base do proxy (ex: http://127.0.0.1:8082/v1).
   */
  getBaseUrl(): string {
    return `http://${this.host}:${this.port}/v1`
  }

  /**
   * Retorna porta em uso.
   */
  getPort(): number {
    return this.port
  }

  /**
   * Retorna host em uso.
   */
  getHost(): string {
    return this.host
  }

  /**
   * Verifica se servidor está rodando.
   */
  isRunning(): boolean {
    return this.started && this.process !== null
  }

  /**
   * Para o servidor graciosamente.
   */
  async stop(): Promise<void> {
    if (!this.process) return

    const childProcess = this.process
    console.log('[FCCServerManager] Parando servidor...')

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (childProcess && !childProcess.killed) {
          if (process.platform === 'win32' && childProcess.pid) {
            // Force kill tree no Windows
            const { exec } = require('child_process')
            exec(`taskkill /PID ${childProcess.pid} /T /F`)
          } else {
            childProcess.kill('SIGKILL')
          }
        }
        resolve()
      }, 3000)

      childProcess.once('close', () => {
        clearTimeout(timer)
        this.process = null
        this.started = false
        this.startPromise = null
        resolve()
      })

      if (process.platform === 'win32' && childProcess.pid) {
        const { exec } = require('child_process')
        exec(`taskkill /PID ${childProcess.pid} /T /F`)
      } else {
        childProcess.kill('SIGINT')
      }
    })
  }
}