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
    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer START')
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

    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer spawning:', fccServerCmd, fccServerArgs.join(' '))
    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer config:', { projectPath, freeProvider, port: 8082, host: '127.0.0.1', apiKeyPresent: !!apiKey, isWindows })

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
      // Health check para fcc-server (apenas monitora, NÃO reinicia - waitForServerHealthy() faz isso)
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
        // REMOVIDO: onFailure que chamava pm.restart(name) - conflitava com waitForServerHealthy()
        // O waitForServerHealthy() já monitora e trata falhas adequadamente
      }
    )

    // Configurar auto-restart para fcc-server
    pm.configureRestart('fcc-server', 3, 2000)
    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer END - process spawned and auto-restart configured')
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
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli START')
    const pm = this.processManager!
    const projectPath = this.config!.projectPath || process.cwd()
    const proxyUrl = 'http://127.0.0.1:8082/v1'

    // buildClaudeCommand agora é async porque pode precisar resolver o
    // caminho do executável no Windows (findClaudeExecutable usa import dinâmico).
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli calling buildClaudeCommand()')
    const { command, args, options } = await this.buildClaudeCommand(proxyUrl, projectPath)
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli buildClaudeCommand returned')

    console.log('[FreeClaudeProvider] Starting Claude CLI:', command, args.join(' '))
    console.log('[FreeClaudeProvider] Working directory:', projectPath)
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli env vars:', {
      ANTHROPIC_BASE_URL: options.env?.ANTHROPIC_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: options.env?.ANTHROPIC_AUTH_TOKEN ? 'SET' : 'NOT SET',
      CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: options.env?.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY,
    })

    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli calling pm.spawn() for claude')
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
          console.warn(`[FreeClaudeProvider] [Pipeline] Process "${name}" stopped, restarting...`)
          pm.restart(name)
        },
      }
    )
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli pm.spawn() returned')

    // Configurar auto-restart para claude
    pm.configureRestart('claude', 3, 2000)
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli END - process spawned and auto-restart configured')
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

    // Variáveis de ambiente para apontar para o proxy local (seguindo wrapper oficial free-claude-code)
    // proxyUrl vem como 'http://127.0.0.1:8082/v1' mas a env var deve ser sem /v1
    const baseUrl = proxyUrl.replace(/\/v1$/, '')
    const authToken = (config as any).apiKey ?? 'freecc'

    console.log('[FreeClaudeProvider] [buildClaudeCommand] Building Claude command')
    console.log('[FreeClaudeProvider] [buildClaudeCommand] proxyUrl:', proxyUrl)
    console.log('[FreeClaudeProvider] [buildClaudeCommand] baseUrl (ANTHROPIC_BASE_URL):', baseUrl)
    console.log('[FreeClaudeProvider] [buildClaudeCommand] authToken present:', !!authToken, authToken ? 'yes' : 'no')
    console.log('[FreeClaudeProvider] [buildClaudeCommand] resolvedModelId:', this.resolvedModelId)
    console.log('[FreeClaudeProvider] [buildClaudeCommand] baseArgs:', baseArgs.join(' '))

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: authToken,
      CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: '1',
      CLAUDE_CODE_IDE: 'infiny',
      CLAUDE_CODE_DISABLE_TELEMETRY: '1',
      CLAUDE_CODE_SKIP_ONBOARDING: '1',
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: '190000',
      DISABLE_AUTOUPDATER: '1',
      DISABLE_FEEDBACK_COMMAND: '1',
      DISABLE_ERROR_REPORTING: '1',
    }

    console.log('[FreeClaudeProvider] [buildClaudeCommand] Environment variables set:')
    console.log('[FreeClaudeProvider] [buildClaudeCommand]   ANTHROPIC_BASE_URL:', env.ANTHROPIC_BASE_URL)
    console.log('[FreeClaudeProvider] [buildClaudeCommand]   ANTHROPIC_AUTH_TOKEN:', env.ANTHROPIC_AUTH_TOKEN ? '***SET***' : 'NOT SET')
    console.log('[FreeClaudeProvider] [buildClaudeCommand]   CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY:', env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY)
    console.log('[FreeClaudeProvider] [buildClaudeCommand]   CLAUDE_CODE_IDE:', env.CLAUDE_CODE_IDE)
    console.log('[FreeClaudeProvider] [buildClaudeCommand]   CLAUDE_CODE_DISABLE_TELEMETRY:', env.CLAUDE_CODE_DISABLE_TELEMETRY)

    if (isWindows) {
      const claudePath = await this.findClaudeExecutable()
      const useShell =
        process.platform === 'win32' && claudePath.toLowerCase().endsWith('.cmd')

      console.log('[FreeClaudeProvider] [buildClaudeCommand] Windows detected')
      console.log('[FreeClaudeProvider] [buildClaudeCommand] claudePath:', claudePath)
      console.log('[FreeClaudeProvider] [buildClaudeCommand] useShell:', useShell)

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

    console.log('[FreeClaudeProvider] [buildClaudeCommand] Non-Windows platform, using "claude" command')
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

    console.log('[FreeClaudeProvider] [Pipeline] setupProcessManagerListeners() START')

    // NOTA: pm.on(...) aqui é o EventEmitter padrão do Node — ele retorna
    // `this` (pra permitir chaining), não uma função de cleanup. Por isso
    // guardamos a referência do handler e removemos com pm.off(...) depois,
    // em vez de depender do valor de retorno de .on().

    // Output do processo "claude" (streaming NDJSON)
    const onOutput = (processName: string, output: string) => {
      console.log('[FreeClaudeProvider] [Pipeline] ProcessManager onProcessOutput', { processName, outputPreview: output.slice(0, 200) })
      if (processName === 'claude') {
        this.handleProviderOutput(output)
      } else if (processName === 'fcc-server') {
        console.log('[FreeClaudeProvider] [Pipeline] fcc-server output:', output.slice(0, 300))
      }
    }
    pm.on('process-output', onOutput)
    this.pmCleanups.push(() => pm.off('process-output', onOutput))

    // Erro do processo
    const onError = (info: ProcessInfo, error: Error) => {
      console.error('[FreeClaudeProvider] [Pipeline] ProcessManager onProcessError', { processName: info.name, error: error.message, stack: error.stack })
      if (info.name === 'claude' || info.name === 'fcc-server') {
        this.errorCallback?.(error.message)
      }
    }
    pm.on('process-error', onError)
    this.pmCleanups.push(() => pm.off('process-error', onError))

    // Saída do processo
    const onStopped = (info: ProcessInfo, code: number | null) => {
      console.log('[FreeClaudeProvider] [Pipeline] ProcessManager onProcessStopped', { processName: info.name, code })
      if (info.name === 'claude') {
        this.exitCallback?.(code ?? 0)
      }
    }
    pm.on('process-stopped', onStopped)
    this.pmCleanups.push(() => pm.off('process-stopped', onStopped))

    console.log('[FreeClaudeProvider] [Pipeline] setupProcessManagerListeners() END - listeners registered')
  }

  /**
   * Processa output bruto do provider (NDJSON stream-json).
   * Parseia e chama callback de dados com apenas o texto.
   */
  private handleProviderOutput(rawData: string): void {
    console.log('[FreeClaudeProvider] [Pipeline] handleProviderOutput START', { rawDataLength: rawData.length, bufferLength: this.messageBuffer.length })
    this.messageBuffer += rawData
    const lines = this.messageBuffer.split('\n')
    this.messageBuffer = lines.pop() || ''

    console.log('[FreeClaudeProvider] [Pipeline] handleProviderOutput split into', lines.length, 'lines, buffer remaining:', this.messageBuffer.length)

    for (const line of lines) {
      if (!line.trim()) continue

      const parsed = this.parseStreamJson(line.trim())
      console.log('[FreeClaudeProvider] [Pipeline] handleProviderOutput parsed:', parsed)
      if (parsed?.text && this.dataCallback) {
        console.log('[FreeClaudeProvider] [Pipeline] handleProviderOutput calling dataCallback', { type: parsed.type, textLength: parsed.text.length })
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
    console.log('[FreeClaudeProvider] [Pipeline] send() START', { messageLength: message.length, imagesCount: images?.length || 0 })
    const pm = this.processManager!
    if (!pm.isRunning('claude')) {
      console.error('[FreeClaudeProvider] [Pipeline] send() FAILED: No active claude process or stdin not writable')
      console.error('[FreeClaudeProvider] [Pipeline] send() pm.isRunning("claude"):', pm.isRunning('claude'))
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

    console.log('[FreeClaudeProvider] [Pipeline] send() JSON payload to Claude:', payload.slice(0, 200) + (payload.length > 200 ? '...' : ''))

    const success = pm.writeToProcess('claude', payload + '\n')
    if (!success) {
      console.error('[FreeClaudeProvider] [Pipeline] send() FAILED: writeToProcess returned false')
      throw new Error('Falha ao escrever no stdin do processo claude')
    }
    console.log('[FreeClaudeProvider] [Pipeline] send() SUCCESS: payload written to stdin, bytes:', Buffer.byteLength(payload + '\n'))
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
      console.log('[FreeClaudeProvider] [Pipeline] parseStreamJson PARSED', { type: parsed.type, subtype: parsed.subtype, hasMessage: !!parsed.message, hasResult: !!parsed.result })

      // Tipo: assistant - conteúdo da resposta
      if (parsed.type === 'assistant' && parsed.message?.content) {
        const textContent = parsed.message.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        if (textContent) {
          console.log('[FreeClaudeProvider] [Pipeline] parseStreamJson ASSISTANT', { textLength: textContent.length })
          return { type: 'assistant', text: textContent }
        }
      }

      // Tipo: result - resultado final
      if (parsed.type === 'result' && parsed.result) {
        console.log('[FreeClaudeProvider] [Pipeline] parseStreamJson RESULT', { textLength: parsed.result.length })
        return { type: 'result', text: parsed.result }
      }

      // Tipo: system - mensagens do sistema
      if (parsed.type === 'system') {
        if (parsed.subtype === 'init') {
          const initText = `Sessão iniciada (${parsed.model || this.resolvedModelId})`
          console.log('[FreeClaudeProvider] [Pipeline] parseStreamJson SYSTEM_INIT', initText)
          return { type: 'system', text: initText }
        }
        if (parsed.subtype === 'thinking_tokens') {
          console.log('[FreeClaudeProvider] [Pipeline] parseStreamJson SYSTEM_THINKING')
          return { type: 'thinking', text: '' }
        }
      }

      console.log('[FreeClaudeProvider] [Pipeline] parseStreamJson IGNORED type:', parsed.type)
      return null
    } catch (error) {
      console.warn('[FreeClaudeProvider] [Pipeline] parseStreamJson FAILED', { linePreview: line.substring(0, 100), error: error instanceof Error ? error.message : String(error) })
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