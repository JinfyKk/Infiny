import { AIProvider, ProviderConfig, ProviderManager } from '../Provider'
import type { FreeClaudeProviderId } from './FreeClaudeConfig'
import { ProcessManager, ProcessInfo } from '../../main/process/ProcessManager'

/**
 * Provider para Free Claude Code (via free-claude-code proxy).
 *
 * Arquitetura NOVA (ProcessManager genérico):
 * 1. Este provider decide quais processos spawnar: "fcc-server" + "claude"
 * 2. Usa ProcessManager.spawn() para iniciar cada processo
 * 3. ProcessManager encaminha stdout/stderr via eventos
 * 4. Este provider parseia NDJSON e chama callbacks onData/onError/onExit
 *
 * IMPORTANTE: setProcessManagerRef() precisa ser chamado ANTES de start().
 * Isso agora é garantido pelo main.ts (ver initializeActiveProvider()).
 */
export class FreeClaudeProvider implements AIProvider {
  // Configuração
  private config: ProviderConfig & { freeProvider?: string } | null = null
  private resolvedModelId: string = ''

  // Referência ao ProcessManager (injetada pelo main.ts ANTES de start())
  private processManager: ProcessManager | null = null

  // Callbacks de evento (um listener ativo por vez)
  private dataCallback: ((data: string) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null
  private exitCallback: ((code: number) => void) | null = null

  // Buffer para parsing NDJSON
  private messageBuffer = ''

  // Cleanup functions for ProcessManager listeners
  private pmCleanups: Array<() => void> = []

  constructor(_providerManager: ProviderManager) {
    console.log('[DEBUG] [FreeClaudeProvider] constructor called')
    // O providerManager não é mais usado diretamente
    // O lifecycle de processos é gerenciado pelo ProcessManager
  }

  // ========== Interface AIProvider ==========

  getId(): string {
    return 'free-claude'
  }

  getName(): string {
    return 'Free Claude Code'
  }

  getSupportedModels(): string[] {
    return [
      'claude-fable-5',
      'claude-opus-4-8',
      'claude-sonnet-5',
      'claude-haiku-4-5-20251001',
      'claude-haiku-4-5',
    ]
  }

  getSupportedEfforts(): string[] {
    return ['low']
  }

  supportsWebSearch(): boolean {
    return false
  }

  supportsImages(): boolean {
    return true
  }

  /**
   * Inicializa o provider para um projeto.
   * Spawna fcc-server e claude CLI via ProcessManager.
   */
  async start(config: ProviderConfig): Promise<void> {
    console.log('[DEBUG] [FreeClaudeProvider] start() - START')
    this.config = { ...config } as ProviderConfig & { freeProvider?: string }

    console.log('[DEBUG] [FreeClaudeProvider] start() - config:', {
      model: this.config.model,
      freeProvider: this.config.freeProvider,
      projectPath: this.config.projectPath,
    })

    this.messageBuffer = ''

    // Se já rodando, parar primeiro
    if (this.isRunning()) {
      console.log('[DEBUG] [FreeClaudeProvider] start() - already running, stopping first')
      await this.stop()
    }

    // 1. Resolver ID do modelo para o provedor gratuito
    console.log('[DEBUG] [FreeClaudeProvider] start() - resolving model ID')
    const { resolveModelId } = await import('./modelMapping')
    const freeProvider = (this.config.freeProvider ?? 'openrouter') as FreeClaudeProviderId
    this.resolvedModelId = resolveModelId(
      this.config.model || 'claude-fable-5',
      freeProvider,
      this.config.modelMapping
    )
    console.log('[DEBUG] [FreeClaudeProvider] start() - model resolved:', this.config.model, '→', this.resolvedModelId)

    // 2. Checar ProcessManager (precisa já ter sido injetado pelo main.ts)
    console.log('[DEBUG] [FreeClaudeProvider] start() - checking ProcessManager, has:', !!this.processManager)
    if (!this.processManager) {
      throw new Error('ProcessManager não injetado. Chame setProcessManagerRef antes de start().')
    }
    console.log('[DEBUG] [FreeClaudeProvider] start() - ProcessManager OK')

    // 3. Spawn fcc-server
    console.log('[DEBUG] [FreeClaudeProvider] start() - calling spawnFccServer()')
    await this.spawnFccServer()
    console.log('[DEBUG] [FreeClaudeProvider] start() - spawnFccServer() completed')

    // 4. Aguardar fcc-server ficar saudável
    console.log('[DEBUG] [FreeClaudeProvider] start() - calling waitForServerHealthy()')
    await this.waitForServerHealthy()
    console.log('[DEBUG] [FreeClaudeProvider] start() - waitForServerHealthy() completed')

    // 5. Spawn Claude CLI apontando para o proxy
    console.log('[DEBUG] [FreeClaudeProvider] start() - calling spawnClaudeCli()')
    await this.spawnClaudeCli()
    console.log('[DEBUG] [FreeClaudeProvider] start() - spawnClaudeCli() completed')

    // 6. Configurar listeners de output do ProcessManager
    console.log('[DEBUG] [FreeClaudeProvider] start() - calling setupProcessManagerListeners()')
    this.setupProcessManagerListeners()
    console.log('[DEBUG] [FreeClaudeProvider] start() - END')
  }

  /**
   * Injeta referência do ProcessManager (chamado pelo main.ts ANTES de start()).
   */
  setProcessManagerRef(pm: ProcessManager): void {
    this.processManager = pm
  }

  /**
   * Spawna o fcc-server proxy.
   *
   * CORRIGIDO (bug ENOENT): o executável instalado via .local/bin no Windows
   * é "fcc-server.exe", não "fcc-server.cmd". O código anterior fixava
   * ".cmd", que nunca existiu, causando spawn ENOENT e loop de restart.
   *
   * Além disso, passamos shell:true no Windows para que a resolução de
   * extensão (.exe/.cmd/.bat via PATHEXT) funcione de forma robusta,
   * igual ao comportamento do PowerShell — assim ficamos protegidos mesmo
   * se uma instalação futura gerar um shim .cmd em vez de um .exe nativo.
   */
  private async spawnFccServer(): Promise<void> {
    console.log('[DEBUG] [FreeClaudeProvider] spawnFccServer() - START')
    const pm = this.processManager!
    const projectPath = this.config!.projectPath || process.cwd()
    const freeProvider = this.config!.freeProvider || 'openrouter'
    const apiKey = (this.config as any).apiKey

    // Build fcc-server command
    const isWindows = process.platform === 'win32'
    const fccServerCmd = await this.findFccServerExecutable()
    const fccServerArgs = [
      '--provider', freeProvider,
      '--port', '8082',
      '--host', '127.0.0.1',
    ]

    if (apiKey) {
      fccServerArgs.push('--api-key', apiKey)
    }

    console.log('[DEBUG] [FreeClaudeProvider] spawnFccServer() - spawning:', fccServerCmd, fccServerArgs.join(' '))

    await pm.spawn(
      'fcc-server',
      fccServerCmd,
      fccServerArgs,
      {
        cwd: projectPath,
        env: {
          ...process.env,
          FCC_SERVER_PROVIDER: freeProvider,
          FCC_SERVER_PORT: '8082',
          FCC_SERVER_HOST: '127.0.0.1',
        },
        windowsHide: true,
        // Resolve .exe/.cmd/.bat via PATHEXT automaticamente no Windows,
        // igual o PowerShell faz com Get-Command.
        shell: isWindows,
      },
      // Health check para fcc-server
      {
        intervalMs: 5000,
        check: async () => {
          try {
            const response = await fetch('http://127.0.0.1:8082/health', {
              method: 'GET',
              signal: AbortSignal.timeout(2000),
            })
            return response.ok || response.status === 404
          } catch {
            return false
          }
        },
        onFailure: (name) => {
          console.warn(`[FreeClaudeProvider] Health check falhou para "${name}", reiniciando...`)
          pm.restart(name)
        },
      }
    )

    // Configurar auto-restart para fcc-server
    pm.configureRestart('fcc-server', 3, 2000)
    console.log('[DEBUG] [FreeClaudeProvider] spawnFccServer() - END')
  }

  /**
   * Aguarda o fcc-server ficar saudável.
   */
  private async waitForServerHealthy(): Promise<void> {
    console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - START')
    const timeout = 30_000
    const startTime = Date.now()
    const urls = [
      'http://127.0.0.1:8082/health',
      'http://127.0.0.1:8082/v1/models',
    ]

    let attempt = 0
    while (Date.now() - startTime < timeout) {
      attempt++
      if (attempt % 10 === 1) {
        console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - attempt:', attempt, 'elapsed:', Date.now() - startTime, 'ms')
      }
      for (const url of urls) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2000)
          const response = await fetch(url, { method: 'GET', signal: controller.signal })
          clearTimeout(timeoutId)

          if (response.ok || response.status === 404) {
            console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - SUCCESS:', url)
            return
          }
        } catch (err) {
          // Ignorar, tentar próximo
          if (attempt % 10 === 1) {
            console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - fetch failed:', url, err instanceof Error ? err.message : String(err))
          }
        }
      }
      await new Promise((r) => setTimeout(r, 500))
    }

    console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - TIMEOUT after', Date.now() - startTime, 'ms')
    throw new Error(`Timeout aguardando fcc-server ficar saudável (${timeout}ms)`)
  }

  /**
   * Spawna o Claude CLI apontando para o proxy local.
   */
  private async spawnClaudeCli(): Promise<void> {
    console.log('[DEBUG] [FreeClaudeProvider] spawnClaudeCli() - START')
    const pm = this.processManager!
    const projectPath = this.config!.projectPath || process.cwd()
    const proxyUrl = 'http://127.0.0.1:8082/v1'

    // buildClaudeCommand agora é async porque pode precisar resolver o
    // caminho do executável no Windows (findClaudeExecutable usa import dinâmico).
    console.log('[DEBUG] [FreeClaudeProvider] spawnClaudeCli() - calling buildClaudeCommand()')
    const { command, args, options } = await this.buildClaudeCommand(proxyUrl, projectPath)
    console.log('[DEBUG] [FreeClaudeProvider] spawnClaudeCli() - buildClaudeCommand returned')

    console.log('[FreeClaudeProvider] Starting Claude CLI:', command, args.join(' '))
    console.log('[FreeClaudeProvider] Working directory:', projectPath)

    console.log('[DEBUG] [FreeClaudeProvider] spawnClaudeCli() - calling pm.spawn() for claude')
    await pm.spawn(
      'claude',
      command,
      args,
      options,
      // Health check para claude CLI - apenas verificar se processo está vivo
      {
        intervalMs: 10_000,
        check: async () => pm.isRunning('claude'),
        onFailure: (name) => {
          console.warn(`[FreeClaudeProvider] Processo "${name}" parou, reiniciando...`)
          pm.restart(name)
        },
      }
    )
    console.log('[DEBUG] [FreeClaudeProvider] spawnClaudeCli() - pm.spawn() returned')

    // Configurar auto-restart para claude
    pm.configureRestart('claude', 3, 2000)
    console.log('[DEBUG] [FreeClaudeProvider] spawnClaudeCli() - END')
  }

  /**
   * Constrói o comando para iniciar o Claude Code baseado na plataforma e configuração.
   *
   * CORRIGIDO: agora é async porque no Windows precisa aguardar
   * findClaudeExecutable(), que faz import dinâmico de 'path' e 'fs'.
   */
  private async buildClaudeCommand(
    proxyUrl: string,
    projectPath: string
  ): Promise<{ command: string; args: string[]; options: any }> {
    const isWindows = process.platform === 'win32'
    const config = this.config!
    const baseArgs = [
      '--model', this.resolvedModelId,
      '--effort', config.effort || 'low',
      '--output-format=stream-json',
      '--input-format=stream-json',
      '--dangerously-skip-permissions',
      '--verbose',
    ]

    // Variáveis de ambiente para apontar para o proxy local
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ANTHROPIC_BASE_URL: proxyUrl,
      ANTHROPIC_AUTH_TOKEN: 'skip',
      CLAUDE_CODE_IDE: 'infiny',
      CLAUDE_CODE_DISABLE_TELEMETRY: '1',
      CLAUDE_CODE_SKIP_ONBOARDING: '1',
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: '190000',
      DISABLE_AUTOUPDATER: '1',
      DISABLE_FEEDBACK_COMMAND: '1',
      DISABLE_ERROR_REPORTING: '1',
    }

    if (isWindows) {
      const claudePath = await this.findClaudeExecutable()
      const useShell = claudePath === 'claude.cmd'

      return {
        command: claudePath,
        args: baseArgs,
        options: {
          cwd: projectPath,
          env,
          shell: useShell,
          windowsHide: true,
        },
      }
    }

    return {
      command: 'claude',
      args: baseArgs,
      options: {
        cwd: projectPath,
        env,
      },
    }
  }

  /**
   * Encontra o executável do Claude no Windows.
   *
   * CORRIGIDO: assinatura agora é `async ... Promise<string>` porque o corpo
   * usa `await import(...)`. Antes a função era declarada como síncrona
   * (`(): string`), o que não compila com `await` dentro dela.
   */
  private async findClaudeExecutable(): Promise<string> {
    const isWindows = process.platform === 'win32'
    if (!isWindows) return 'claude'

    const { join } = await import('path')
    const { existsSync } = await import('fs')

    const candidates = [
      'claude.cmd',
      join(process.env.APPDATA || '', 'npm', 'claude.cmd'),
      join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', 'claude.cmd'),
      join(process.env.LOCALAPPDATA || '', 'npm', 'claude.cmd'),
    ]

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        console.log('[FreeClaudeProvider] Found claude at:', candidate)
        return candidate
      }
    }

    console.log('[FreeClaudeProvider] Using shell fallback for claude.cmd')
    return 'claude.cmd'
  }

  /**
   * Encontra o executável do fcc-server de forma robusta.
   *
   * No Windows, o executável real pode ser .exe em .local/bin (ex: C:\Users\Jinfy\.local\bin\fcc-server.exe)
   * e não necessariamente .cmd. No Linux/Mac, é apenas 'fcc-server' no PATH.
   * Esta função tenta localizar o executável completo antes de cair no fallback do shell.
   */
  private async findFccServerExecutable(): Promise<string> {
    const isWindows = process.platform === 'win32'
    if (!isWindows) return 'fcc-server'

    const { join } = await import('path')
    const { existsSync } = await import('fs')

    const candidates = [
      'fcc-server.exe',
      join(process.env.LOCALAPPDATA || '', 'bin', 'fcc-server.exe'),
      join(process.env.USERPROFILE || '', '.local', 'bin', 'fcc-server.exe'),
      join(process.env.APPDATA || '', 'npm', 'fcc-server.exe'),
      join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', 'fcc-server.exe'),
    ]

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        console.log('[FreeClaudeProvider] Found fcc-server at:', candidate)
        return candidate
      }
    }

    console.log('[FreeClaudeProvider] Using shell fallback for fcc-server.exe')
    return 'fcc-server.exe'
  }

  /**
   * Configura listeners do ProcessManager para receber stdout/stderr do processo "claude".
   */
  private setupProcessManagerListeners(): void {
    const pm = this.processManager!
    if (!pm) return

    // Cleanup listeners anteriores
    this.cleanupProcessManagerListeners()

    // NOTA: pm.on(...) aqui é o EventEmitter padrão do Node — ele retorna
    // `this` (pra permitir chaining), não uma função de cleanup. Por isso
    // guardamos a referência do handler e removemos com pm.off(...) depois,
    // em vez de depender do valor de retorno de .on().

    // Output do processo "claude" (streaming NDJSON)
    const onOutput = (processName: string, output: string) => {
      if (processName === 'claude') {
        this.handleProviderOutput(output)
      }
    }
    pm.on('process-output', onOutput)
    this.pmCleanups.push(() => pm.off('process-output', onOutput))

    // Erro do processo
    const onError = (info: ProcessInfo, error: Error) => {
      if (info.name === 'claude' || info.name === 'fcc-server') {
        this.errorCallback?.(error.message)
      }
    }
    pm.on('process-error', onError)
    this.pmCleanups.push(() => pm.off('process-error', onError))

    // Saída do processo
    const onStopped = (info: ProcessInfo, code: number | null) => {
      if (info.name === 'claude') {
        this.exitCallback?.(code ?? 0)
      }
    }
    pm.on('process-stopped', onStopped)
    this.pmCleanups.push(() => pm.off('process-stopped', onStopped))
  }

  /**
   * Processa output bruto do provider (NDJSON stream-json).
   * Parseia e chama callback de dados com apenas o texto.
   */
  private handleProviderOutput(rawData: string): void {
    this.messageBuffer += rawData
    const lines = this.messageBuffer.split('\n')
    this.messageBuffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue

      const parsed = this.parseStreamJson(line.trim())
      if (parsed?.text && this.dataCallback) {
        if (parsed.type === 'assistant' || parsed.type === 'result') {
          this.dataCallback(parsed.text)
        } else if (parsed.type === 'system') {
          this.dataCallback(`\n[${parsed.text}]\n`)
        }
      }
    }
  }

  /**
   * Envia mensagem para o Claude CLI via ProcessManager → stdin.
   */
  async send(message: string, images?: string[]): Promise<void> {
    const pm = this.processManager!
    if (!pm.isRunning('claude')) {
      console.error('[FreeClaudeProvider] No active claude process or stdin not writable')
      throw new Error('Processo Claude não está rodando')
    }

    const payload = images && images.length > 0
      ? JSON.stringify({
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'text', text: message },
              ...images.map((img) => ({ type: 'image', source: { type: 'base64', data: img } }))
            ]
          }
        })
      : JSON.stringify({ type: 'user', message: { role: 'user', content: message } })

    console.log('[FreeClaudeProvider] Sending:', payload.substring(0, 200))

    const success = pm.writeToProcess('claude', payload + '\n')
    if (!success) {
      throw new Error('Falha ao escrever no stdin do processo claude')
    }
  }

  /**
   * Para o provider graciosamente via ProcessManager.
   */
  async stop(): Promise<void> {
    console.log('[FreeClaudeProvider] Stopping...')

    try {
      if (this.processManager) {
        // Parar claude primeiro
        if (this.processManager.isRunning('claude')) {
          await this.processManager.stop('claude')
        }
        // Parar fcc-server
        if (this.processManager.isRunning('fcc-server')) {
          await this.processManager.stop('fcc-server')
        }
      }
    } catch (error) {
      console.error('[FreeClaudeProvider] Error stopping:', error)
    }

    this.cleanupProcessManagerListeners()
    this.config = null
    this.resolvedModelId = ''
    this.messageBuffer = ''
    console.log('[FreeClaudeProvider] Stopped')
  }

  /**
   * Reinicia o provider com mesma configuração.
   */
  async restart(): Promise<void> {
    if (!this.config) {
      throw new Error('Sem configuração salva para reiniciar')
    }
    const savedConfig = { ...this.config }
    await this.stop()
    await new Promise((r) => setTimeout(r, 500))
    await this.start(savedConfig)
  }

  isRunning(): boolean {
    return this.config !== null && this.processManager?.isRunning('claude') === true
  }

  onData(callback: (data: string) => void): () => void {
    this.dataCallback = callback
    return () => {
      this.dataCallback = null
    }
  }

  onError(callback: (error: string) => void): () => void {
    this.errorCallback = callback
    return () => {
      this.errorCallback = null
    }
  }

  onExit(callback: (code: number) => void): () => void {
    this.exitCallback = callback
    return () => {
      this.exitCallback = null
    }
  }

  // ========== Métodos Públicos Extras ==========

  getFreeProvider(): string | undefined {
    return this.config?.freeProvider
  }

  getResolvedModelId(): string {
    return this.resolvedModelId
  }

  // ========== Parser NDJSON (reutilizado do ClaudeProvider) ==========

  /**
   * Parseia uma linha do stream JSON do claude CLI.
   * Formato: stream-json do Anthropic (NDJSON).
   */
  private parseStreamJson(line: string): { type: string; text?: string } | null {
    try {
      const parsed = JSON.parse(line)

      // Tipo: assistant - conteúdo da resposta
      if (parsed.type === 'assistant' && parsed.message?.content) {
        const textContent = parsed.message.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        if (textContent) {
          return { type: 'assistant', text: textContent }
        }
      }

      // Tipo: result - resultado final
      if (parsed.type === 'result' && parsed.result) {
        return { type: 'result', text: parsed.result }
      }

      // Tipo: system - mensagens do sistema
      if (parsed.type === 'system') {
        if (parsed.subtype === 'init') {
          return { type: 'system', text: `Sessão iniciada (${parsed.model || this.resolvedModelId})` }
        }
        if (parsed.subtype === 'thinking_tokens') {
          return { type: 'thinking', text: '' }
        }
      }

      return null
    } catch {
      return null
    }
  }

  // ========== Cleanup ==========

  private cleanupProcessManagerListeners(): void {
    this.pmCleanups.forEach((cleanup) => cleanup())
    this.pmCleanups = []
  }
}

/**
 * Factory para registro no ProviderManager.
 */
export function createFreeClaudeProvider(providerManager: ProviderManager): FreeClaudeProvider {
  return new FreeClaudeProvider(providerManager)
}

// Re-export types e utilitários
export type {
  FreeClaudeConfig,
  FreeClaudeProviderId,
} from './FreeClaudeConfig'
export {
  DEFAULT_FREE_CLAUDE_CONFIG,
} from './FreeClaudeConfig'
export {
  getSupportedModelsForProvider,
  getModelLabel,
  getModelDescription,
  resolveModelId,
} from './modelMapping'