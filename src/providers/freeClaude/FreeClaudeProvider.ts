import { AIProvider, ProviderConfig, ProviderManager } from '../Provider'
import type { FreeClaudeProviderId } from './FreeClaudeConfig'
import { ProcessManager, ProcessInfo } from '../../main/process/ProcessManager'

/**
 * Mapeamento de FreeClaudeProviderId para a environment variable
 * correspondente à API key do provedor (credential_env do provider_catalog.py).
 * Provedores locais (ollama, lmstudio, llamacpp, vertex) não usam API key via env var.
 */
const PROVIDER_API_KEY_ENV: Record<FreeClaudeProviderId, string | undefined> = {
  openrouter: 'OPENROUTER_API_KEY',
  groq: 'GROQ_API_KEY',
  ollama: undefined, // local, sem API key
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  cohere: 'COHERE_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  together: 'TOGETHER_API_KEY',
  xai: 'XAI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  mistral_codestral: 'CODESTRAL_API_KEY',
  nvidia: 'NVIDIA_NIM_API_KEY',
  bedrock: 'AWS_BEARER_TOKEN_BEDROCK',
  vertex: undefined, // usa ADC (Application Default Credentials)
  cloudflare: 'CLOUDFLARE_API_TOKEN', // também precisa CLOUDFLARE_ACCOUNT_ID
  huggingface: 'HUGGINGFACE_API_KEY',
  github_models: 'GITHUB_MODELS_TOKEN',
  wafer: 'WAFER_API_KEY',
  kimi: 'KIMI_API_KEY',
  kimi_code: 'KIMI_CODE_API_KEY',
  minimax: 'MINIMAX_API_KEY',
  fireworks: 'FIREWORKS_API_KEY',
  sambanova: 'SAMBANOVA_API_KEY',
  zai: 'ZAI_API_KEY',
  opencode: 'OPENCODE_API_KEY',
  opencode_go: 'OPENCODE_API_KEY',
  vercel: 'AI_GATEWAY_API_KEY',
  ollama_cloud: 'OLLAMA_API_KEY',
  lmstudio: undefined, // local, sem API key
  llamacpp: undefined, // local, sem API key
  custom: undefined, // usuário define manualmente
}

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
  private readyCallback: (() => void) | null = null

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

    // 7. Emitir evento de provider pronto
    console.log('[DEBUG] [FreeClaudeProvider] start() - emitting provider-ready event')
    this.readyCallback?.()
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
   * IMPORTANTE: O fcc-server NÃO aceita argumentos CLI para configuração
   * (exceto --version). Toda configuração vem via environment variables.
   * Fonte: free-claude-code/src/free_claude_code/cli/commands.py:serve()
   *
   * Variáveis esperadas (conforme settings.py e provider_catalog.py):
   * - OPENROUTER_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, etc. (baseado no freeProvider)
   * - ANTHROPIC_AUTH_TOKEN (token do proxy, padrão 'freecc')
   * - MODEL (opcional, default no settings.py: nvidia_nim/nvidia/nemotron-3-super-120b-a12b)
   *
   * O servidor sobe em host=0.0.0.0 port=8082 (hardcoded defaults no free-claude-code).
   */
  private async spawnFccServer(): Promise<void> {
    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer START')
    const pm = this.processManager!
    const projectPath = this.config!.projectPath || process.cwd()
    const freeProvider = (this.config!.freeProvider || 'openrouter') as FreeClaudeProviderId
    const apiKey = (this.config as any).apiKey

    // fcc-server NÃO aceita argumentos de configuração (--provider, --port, --host, etc.)
    // Toda configuração é via environment variables
    const fccServerCmd = await this.findFccServerExecutable()
    const fccServerArgs: string[] = [] // NENHUM argumento - fcc-server não suporta

    // Constrói env vars corretas para o fcc-server
    const env = this.buildFccServerEnv(freeProvider, apiKey)

    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer spawning:', fccServerCmd, '(no args)')
    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer config:', {
      projectPath,
      freeProvider,
      port: 8082,
      host: '0.0.0.0 (fcc-server default)',
      apiKeyEnvVar: this.getProviderApiKeyEnvVar(freeProvider) || 'N/A (local provider)',
      apiKeyPresent: !!apiKey,
      authTokenEnvVar: 'ANTHROPIC_AUTH_TOKEN',
      isWindows: process.platform === 'win32',
    })

    // Log das env vars relevantes sendo passadas (sem valores sensíveis)
    const relevantEnvVars = [
      'ANTHROPIC_AUTH_TOKEN',
      'OPENROUTER_API_KEY',
      'GROQ_API_KEY',
      'GEMINI_API_KEY',
      'DEEPSEEK_API_KEY',
      'MISTRAL_API_KEY',
      'CODESTRAL_API_KEY',
      'NVIDIA_NIM_API_KEY',
      'AWS_BEARER_TOKEN_BEDROCK',
      'HUGGINGFACE_API_KEY',
      'COHERE_API_KEY',
      'GITHUB_MODELS_TOKEN',
      'SAMBANOVA_API_KEY',
      'ZAI_API_KEY',
      'FIREWORKS_API_KEY',
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
      'AI_GATEWAY_API_KEY',
      'OPENCODE_API_KEY',
      'WAFER_API_KEY',
      'KIMI_API_KEY',
      'KIMI_CODE_API_KEY',
      'MINIMAX_API_KEY',
      'CEREBRAS_API_KEY',
      'VERTEX_PROJECT_ID',
      'OLLAMA_API_KEY',
      'MODEL',
    ]
    const envLog: Record<string, string> = {}
    for (const key of relevantEnvVars) {
      if (env[key]) {
        envLog[key] = key.includes('KEY') || key.includes('TOKEN') || key.includes('SECRET') ? '***SET***' : env[key]!
      }
    }
    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer env vars:', envLog)

    await pm.spawn(
      'fcc-server',
      fccServerCmd,
      fccServerArgs,
      {
        cwd: projectPath,
        env,
        windowsHide: true,
        // Resolve .exe/.cmd/.bat via PATHEXT automaticamente no Windows
        shell: process.platform === 'win32',
      },
      // Health check para fcc-server - APENAS monitora, NÃO reinicia
      // O waitForServerHealthy() faz o monitoramento ativo durante startup
      {
        intervalMs: 5000,
        check: async () => {
          try {
            const response = await fetch('http://127.0.0.1:8082/health', {
              method: 'GET',
              signal: AbortSignal.timeout(2000),
            })
            // APENAS 2xx = saudável. 404 NÃO é sucesso (health endpoint deve retornar 200 OK)
            return response.ok
          } catch {
            return false
          }
        },
        // SEM onFailure aqui - waitForServerHealthy() gerencia falhas
      }
    )

    // NÃO configurar auto-restart para fcc-server aqui
    // O waitForServerHealthy() já trata tentativas e falhas adequadamente
    // pm.configureRestart('fcc-server', 3, 2000) // REMOVIDO: conflitava com health check ativo

    console.log('[FreeClaudeProvider] [Pipeline] spawnFccServer END - process spawned (no auto-restart)')
  }

  /**
   * Constrói environment variables para o fcc-server baseado no provedor escolhido.
   * Mapeia FreeClaudeProviderId para a env var de API key correta (conforme provider_catalog.py).
   */
  private buildFccServerEnv(freeProvider: FreeClaudeProviderId, apiKey?: string): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...process.env }

    // Proxy auth token (para proteger o endpoint local se desejado)
    // freecc é o valor padrão usado pelo wrapper oficial fcc-claude
    env.ANTHROPIC_AUTH_TOKEN = 'freecc'

    // API Key do provedor selecionado
    if (apiKey) {
      const apiKeyEnvVar = this.getProviderApiKeyEnvVar(freeProvider)
      if (apiKeyEnvVar) {
        env[apiKeyEnvVar] = apiKey
      }
    }

    return env
  }

  /**
   * Retorna o nome da environment variable de API key para o provedor.
   * Baseado no provider_catalog.py do free-claude-code (credential_env).
   * Retorna undefined para provedores locais (ollama, lmstudio, llamacpp, vertex) que não usam API key via env.
   */
  private getProviderApiKeyEnvVar(freeProvider: FreeClaudeProviderId): string | undefined {
    return PROVIDER_API_KEY_ENV[freeProvider]
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

          // APENAS 2xx = sucesso. 404 NÃO é sucesso (health endpoint deve retornar 200 OK)
          if (response.ok) {
            console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - SUCCESS:', url, 'status:', response.status)
            return
          }
          console.log('[DEBUG] [FreeClaudeProvider] waitForServerHealthy() - non-OK status:', url, response.status)
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
   * Configura listeners do ProcessManager para receber stdout/stderr do processo "claude" e "fcc-server".
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

    // Output do processo "claude" (streaming NDJSON) e "fcc-server"
    const onOutput = (processName: string, output: string) => {
      console.log('[FreeClaudeProvider] [Pipeline] ProcessManager onProcessOutput', { processName, outputPreview: output.slice(0, 200) })
      if (processName === 'claude') {
        this.handleProviderOutput(output)
      } else if (processName === 'fcc-server') {
        // Log mais verbose do fcc-server para debug
        console.log('[FreeClaudeProvider] [Pipeline] fcc-server stdout:', output.trim().slice(0, 500))
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

    // Saída do processo - log completo com código de saída e motivo
    const onStopped = (info: ProcessInfo, code: number | null) => {
      const reason = code === 0 ? 'clean exit' : code === null ? 'signal/killed' : `exit code ${code}`
      console.log('[FreeClaudeProvider] [Pipeline] ProcessManager onProcessStopped', {
        processName: info.name,
        code,
        reason,
        startedAt: info.startedAt,
        uptimeMs: Date.now() - info.startedAt,
        command: info.command,
        args: info.args.join(' '),
      })
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

  onReady(callback: () => void): () => void {
    this.readyCallback = callback
    return () => {
      this.readyCallback = null
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