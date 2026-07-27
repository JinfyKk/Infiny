import { AIProvider, ProviderConfig, ProviderManager } from '../Provider'
import { ProcessManager, ProcessInfo } from '../../main/process/ProcessManager'
import { TURTLY_SYSTEM_PROMPT } from '../persona'

/**
 * Provider para Free Claude Code (via free-claude-code proxy).
 *
 * Arquitetura NOVA (integração nativa):
 * 1. Este provider orquestra o ciclo de vida: fcc-server → fcc-claude
 * 2. ProcessManager gerencia processos genericamente (spawn/stop/monitor)
 * 3. fcc-server lê configuração do ~/.config/fcc/.env (NÃO recebe args/env do Infiny)
 * 4. fcc-claude injeta ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, etc. automaticamente
 * 5. Modelos usam nomes Anthropic puros (claude-fable-5, claude-opus-4-8, etc.)
 *    - Resolução para modelo real (nvidia_nim/..., openrouter/...) feita pelo fcc-server
 *
 * IMPORTANTE: setProcessManagerRef() deve ser chamado ANTES de start().
 * Isso é garantido pelo main.ts (ver initializeActiveProvider()).
 */
export class FreeClaudeProvider implements AIProvider {
  // Configuração
  private config: ProviderConfig | null = null

  // Referência ao ProcessManager (injetada pelo main.ts ANTES de start())
  private processManager: ProcessManager | null = null

  // Callbacks de evento (um listener ativo por vez)
  private dataCallback: ((data: string) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null
  private exitCallback: ((code: number) => void) | null = null
  private readyCallback: (() => void) | null = null
  private healthyCallback: (() => void) | null = null
  private responseCompleteCallback: (() => void) | null = null

  // Buffer para parsing NDJSON
  private messageBuffer = ''

  // Cleanup functions for ProcessManager listeners
  private pmCleanups: Array<() => void> = []

  // Fila de operações para evitar start/stop concorrentes
  private _opQueue: Promise<void> = Promise.resolve()

  // Lock para evitar spawn concorrente de fcc-server (SINGLETON)
  // Se já existe uma inicialização em andamento, aguarda a mesma Promise
  private _fccServerInitPromise: Promise<void> | null = null

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
    // Nomes Anthropic puros - o fcc-server resolve internamente via MODEL_FABLE, MODEL_OPUS, etc.
    return [
      'claude-fable-5',
      'claude-opus-5',
      'claude-sonnet-5',
      'claude-haiku-5',
      'claude-haiku-4-5-20251001',
    ]
  }

  getSupportedEfforts(): string[] {
    // O Claude Code CLI oficial suporta: low, medium, high, max, xhigh, ultracode
    // O free-claude-code proxy repassa --effort para a API.
    return ['low', 'medium', 'high', 'max', 'xhigh', 'ultracode']
  }

  supportsWebSearch(): boolean {
    return false
  }

  supportsImages(): boolean {
    return true
  }

  /**
   * Inicializa o provider para um projeto.
   * Orquestra: fcc-server → (health check) → fcc-claude
   *
   * ARQUITETURA SINGLETON:
   * - fcc-server é spawnado UMA VEZ por processo Electron
   * - Reutiliza servidor existente se saudável
   * - Reinicia APENAS fcc-claude quando model/effort/projectPath mudam
   * - start() é idempotente: mesma config = no-op
   *
   * Usa fila de operações (_opQueue) para serializar chamadas concorrentes.
   */
  async start(config: ProviderConfig): Promise<void> {
    const task = this._opQueue.then(async () => {
      console.log('[DEBUG] [FreeClaudeProvider] start() - START (queue)')
      console.log('[DEBUG] [FreeClaudeProvider] start() - incoming config:', {
        model: config.model,
        effort: config.effort,
        webSearch: config.webSearch,
        projectPath: config.projectPath,
      })

      // ---- IDEMPOTÊNCIA: verificar o que mudou ----
      const previousConfig = this.config
      const isFirstStart = !previousConfig

      // Detectar mudanças relevantes
      const modelChanged = previousConfig ? previousConfig.model !== config.model : true
      const effortChanged = previousConfig ? previousConfig.effort !== config.effort : true
      const webSearchChanged = previousConfig ? previousConfig.webSearch !== config.webSearch : true
      const projectPathChanged = previousConfig ? previousConfig.projectPath !== config.projectPath : true

      // Atualizar config AGORA (antes de decisões de restart)
      this.config = { ...config } as ProviderConfig
      this.messageBuffer = ''

      // Se nada mudou relevante e já está rodando, no-op
      if (!isFirstStart && !modelChanged && !effortChanged && !webSearchChanged && !projectPathChanged && this.isRunning()) {
        console.log('[DEBUG] [FreeClaudeProvider] start() - IDEMPOTENT: nothing changed, already running, skipping')
        return
      }

      console.log('[DEBUG] [FreeClaudeProvider] start() - changes detected:', {
        isFirstStart,
        modelChanged,
        effortChanged,
        webSearchChanged,
        projectPathChanged,
      })

      // 1. Checar ProcessManager (precisa já ter sido injetado pelo main.ts)
      console.log('[DEBUG] [FreeClaudeProvider] start() - checking ProcessManager, has:', !!this.processManager)
      if (!this.processManager) {
        throw new Error('ProcessManager não injetado. Chame setProcessManagerRef antes de start().')
      }
      console.log('[DEBUG] [FreeClaudeProvider] start() - ProcessManager OK')

      // 2. fcc-server: SINGLETON - reusar se saudável, senão spawnar
      //    Só precisa do fcc-server rodando. Não depende de projectPath/model/effort.
      await this.ensureFccServerRunning()

      // 3. fcc-claude: reiniciar SE model/effort/projectPath mudaram (ou primeiro start)
      const claudeNeedsRestart = isFirstStart || modelChanged || effortChanged || projectPathChanged
      if (claudeNeedsRestart) {
        console.log('[DEBUG] [FreeClaudeProvider] start() - fcc-claude needs restart:', { modelChanged, effortChanged, projectPathChanged })
        await this.restartClaudeCli()
      } else {
        console.log('[DEBUG] [FreeClaudeProvider] start() - fcc-claude unchanged, keeping running')
      }

      // 4. Configurar listeners de output do ProcessManager (sempre reconfigurar para garantir callbacks ativos)
      console.log('[DEBUG] [FreeClaudeProvider] start() - calling setupProcessManagerListeners()')
      this.setupProcessManagerListeners()
      console.log('[DEBUG] [FreeClaudeProvider] start() - setupProcessManagerListeners() completed')

      // 5. Emitir evento de provider pronto
      console.log('[DEBUG] [FreeClaudeProvider] start() - emitting provider-ready event')
      this.readyCallback?.()
    })

    this._opQueue = task.catch(() => {})

    // Aguardar (e propagar erro de) esta operação especificamente
    await task
  }

  /**
   * Injeta referência do ProcessManager (chamado pelo main.ts ANTES de start()).
   */
  setProcessManagerRef(pm: ProcessManager): void {
    this.processManager = pm
  }

  /**
   * Garante que o fcc-server está rodando e saudável (SINGLETON).
   *
   * Fluxo:
   * 1. Verifica se já existe processo 'fcc-server' no ProcessManager
   * 2. Se existe e isHealthy() passa: REUTILIZA, loga "Reusing existing server", retorna
   * 3. Se não existe ou unhealthy: spawn novo via spawnFccServerInternal()
   * 4. Aguarda health check via waitForServerHealthy()
   * 5. Emite healthyCallback
   *
   * NUNCA spawnar outro enquanto um saudável existir.
   *
   * PROTEÇÃO CONTRA RACE CONDITION:
   * Se já existe uma inicialização em andamento (_fccServerInitPromise),
   * aguarda essa Promise em vez de iniciar outra.
   */
  private async ensureFccServerRunning(): Promise<void> {
    const pm = this.processManager!

    // LOCK: Se já existe inicialização em andamento, aguardar a mesma Promise
    // Isso evita que duas chamadas concorrentes passem pelo check de isRunning/isHealthy
    // e ambas tentem fazer spawn do fcc-server
    if (this._fccServerInitPromise) {
      console.log('[FCC LOCK] Waiting existing initialization...')
      await this._fccServerInitPromise
      console.log('[FCC LOCK] Existing initialization completed')
      // Após aguardar, verificar novamente se ficou saudável
      if (pm.isRunning('fcc-server') && await pm.isHealthy('fcc-server')) {
        console.log('[FCC LOCK] Server healthy after waiting existing init')
        this.healthyCallback?.()
        return
      }
      // Se não ficou saudável, prosseguir para spawn (cai no fluxo normal abaixo)
      console.log('[FCC LOCK] Previous init did not result in healthy server, proceeding...')
    }

    console.log('[FCC] Checking existing fcc-server...')

    // 1. Verificar se processo existe no ProcessManager
    if (pm.isRunning('fcc-server')) {
      console.log('[FCC] fcc-server process found in ProcessManager, checking health...')

      // 2. Verificar saúde via ProcessManager.isHealthy()
      const isHealthy = await pm.isHealthy('fcc-server')
      if (isHealthy) {
        console.log('[FCC SINGLETON] Reusing existing server')
        console.log('[FCC SINGLETON] Skip spawn')
        this.healthyCallback?.()
        return
      }

      console.log('[FCC] Existing fcc-server is UNHEALTHY, will restart')
    } else {
      console.log('[FCC] No fcc-server process found, will spawn new')
    }

    // 3. Spawn novo servidor (para primeira vez ou unhealthy)
    // Criar Promise de inicialização ANTES de iniciar, para que chamadas concorrentes
    // possam aguardar esta mesma Promise
    this._fccServerInitPromise = (async () => {
      try {
        await this.spawnFccServerInternal()
        await this.waitForServerHealthy()
      } finally {
        // Limpar a Promise após concluir (sucesso ou falha)
        this._fccServerInitPromise = null
      }
    })()

    await this._fccServerInitPromise

    // 5. Emitir evento de servidor saudável
    this.healthyCallback?.()
  }

  /**
   * Spawna o fcc-server proxy (interno, chamado apenas quando necessário).
   *
   * IMPORTANTE: O fcc-server NÃO aceita argumentos CLI para configuração
   * (exceto --version). Toda configuração vem via environment variables
   * carregadas do ~/.config/fcc/.env pelo Settings do free-claude-code.
   * Fonte: free-claude-code/src/free_claude_code/cli/commands.py:serve()
   */
  private async spawnFccServerInternal(): Promise<void> {
    console.log('[FCC] [Pipeline] spawnFccServerInternal START - spawning NEW server')
    const pm = this.processManager!
    const projectPath = this.config!.projectPath || process.cwd()

    // fcc-server NÃO aceita argumentos de configuração (--provider, --port, --host, etc.)
    // Toda configuração é via environment variables (Settings carrega de ~/.config/fcc/.env)
    const fccServerCmd = await this.findFccServerExecutable()
    const fccServerArgs: string[] = [] // NENHUM argumento - fcc-server não suporta

    // Environment variables MÍNIMAS - apenas o token de auth do proxy
    // O fcc-server lê API keys, modelo, proxy, etc. do seu próprio .env
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      // Proxy auth token (para proteger o endpoint local se desejado)
      // 'freecc' é o valor padrão usado pelo wrapper oficial fcc-claude
      ANTHROPIC_AUTH_TOKEN: 'freecc',
    }

    console.log('[FCC] [Pipeline] spawnFccServerInternal spawning:', fccServerCmd, '(no args)')
    console.log('[FCC] [Pipeline] spawnFccServerInternal config:', {
      projectPath,
      port: 8082,
      host: '0.0.0.0',
      isWindows: process.platform === 'win32',
    })

    await pm.spawn(
      'fcc-server',
      fccServerCmd,
      fccServerArgs,
      {
        cwd: projectPath,
        env,
        windowsHide: true,
        // IMPORTANTE: NÃO usar shell aqui. fccServerCmd já é o caminho
        // absoluto do .exe (ver findFccServerExecutable()), então shell
        // não é necessário para resolvê-lo. Com shell:true no Windows, o
        // Node cria o fcc-server.exe como filho de um cmd.exe invisível;
        // ao chamar child.kill() para parar o processo, apenas o cmd.exe
        // morre e o fcc-server.exe (que já fez bind na porta 8082) fica
        // órfão rodando em background. Na próxima abertura do app, o novo
        // fcc-server não consegue mais subir na porta 8082 (WinError 10048)
        // e o chat para de funcionar.
        shell: false,
      },
      // Health check para fcc-server - configurado no ProcessManager para isHealthy()
      // Também usado pelo waitForServerHealthy() para monitoramento ativo durante startup
      {
        intervalMs: 5000,
        check: async () => {
          try {
            const response = await fetch('http://127.0.0.1:8082/health', {
              method: 'GET',
              signal: AbortSignal.timeout(2000),
              headers: { Authorization: 'Bearer freecc' },
            })
            // APENAS 2xx = saudável. 404 NÃO é sucesso (health endpoint deve retornar 200 OK)
            return response.ok
          } catch {
            return false
          }
        },
        // Configuração para isHealthy() - retries rápidos
        singleCheckRetries: 3,
        singleCheckDelayMs: 500,
        // SEM onFailure aqui - waitForServerHealthy() gerencia falhas
      }
    )

    // NÃO configurar auto-restart para fcc-server aqui
    // O waitForServerHealthy() já trata tentativas e falhas adequadamente
    // pm.configureRestart('fcc-server', 3, 2000) // REMOVIDO: conflitava com health check ativo

    console.log('[FCC] [Pipeline] spawnFccServerInternal END - NEW process spawned (no auto-restart)')
  }

  /**
   * Aguarda o fcc-server ficar saudável (health check ativo durante startup).
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
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: { Authorization: 'Bearer freecc' },
          })
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
   * Spawna o fcc-claude (launcher oficial) apontando para o proxy local.
   *
   * O fcc-claude injeta automaticamente:
   * - ANTHROPIC_BASE_URL=http://127.0.0.1:8082/v1
   * - ANTHROPIC_AUTH_TOKEN=freecc
   * - CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
   * - CLAUDE_CODE_AUTO_COMPACT_WINDOW=190000
   * - DISABLE_AUTOUPDATER=1, etc.
   *
   * Nomes de modelo usam formato Anthropic puro:
   * --model claude-fable-5
   * O fcc-server resolve internamente via MODEL_FABLE, MODEL_OPUS, etc.
   */
  private async spawnClaudeCli(): Promise<void> {
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli START')
    const pm = this.processManager!
    const projectPath = this.config!.projectPath || process.cwd()

    // Args compatíveis com Claude Code CLI oficial
    const model = this.config!.model || 'claude-fable-5'
    const effort = this.config!.effort || 'low'

    const baseArgs = [
      '--model', model,
      '--effort', effort,
      '--output-format=stream-json',
      '--input-format=stream-json',
      '--dangerously-skip-permissions',
      '--verbose',
      '--append-system-prompt', TURTLY_SYSTEM_PROMPT,
    ]

    // Encontrar executável fcc-claude (launcher oficial)
    const fccClaudeCmd = await this.findFccClaudeExecutable()

    console.log('[FreeClaudeProvider] Starting fcc-claude:', fccClaudeCmd, baseArgs.join(' '))
    console.log('[FreeClaudeProvider] Working directory:', projectPath)

    await pm.spawn(
      'claude',
      fccClaudeCmd,
      baseArgs,
      {
        cwd: projectPath,
        env: process.env, // fcc-claude injeta as env vars de proxy automaticamente
        windowsHide: true,
        shell: false,
      },
      // Health check para claude CLI - APENAS monitora/loga, não reinicia.
      //
      // NOTA (fix): antes, o onFailure aqui chamava pm.restart(name) direto,
      // criando uma SEGUNDA via de auto-restart totalmente independente da
      // do ProcessManager (configureRestart() + maybeAutoRestart(), logo
      // abaixo). Essa segunda via não tinha nenhuma visibilidade sobre
      // intentionalStops: se o processo estivesse parado de propósito (ex.:
      // troca de projeto) bem no momento em que este intervalo de 10s
      // ticasse, ela reiniciava o claude de qualquer jeito, sem checar o
      // motivo. Como o ProcessManager já cuida disso corretamente via
      // handleProcessExit()/maybeAutoRestart() (que respeita
      // intentionalStops e tem sua própria política de maxRetries/backoff
      // configurada logo abaixo por pm.configureRestart()), esse onFailure
      // era redundante e um segundo ponto de restart fantasma. Removido.
      {
        intervalMs: 10_000,
        check: async () => pm.isRunning('claude'),
      }
    )
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli pm.spawn() returned')

    // Configurar auto-restart para claude (via ProcessManager)
    pm.configureRestart('claude', 3, 2000)
    console.log('[FreeClaudeProvider] [Pipeline] spawnClaudeCli END - process spawned and auto-restart configured')
  }

  /**
   * Reinicia APENAS o fcc-claude (launcher), mantendo o fcc-server rodando.
   * Usado quando projectPath, model ou effort mudam, mas o server não precisa reiniciar.
   */
  private async restartClaudeCli(): Promise<void> {
    console.log('[FreeClaudeProvider] [Pipeline] restartClaudeCli START - restarting ONLY claude process')
    const pm = this.processManager!

    // Parar claude atual se estiver rodando
    if (pm.isRunning('claude')) {
      console.log('[FreeClaudeProvider] [Pipeline] restartClaudeCli - stopping existing claude')
      await pm.stop('claude')
    }

    // Spawn novo claude com config atualizada
    await this.spawnClaudeCli()
    console.log('[FreeClaudeProvider] [Pipeline] restartClaudeCli END - new claude process spawned')
  }

  /**
   * Encontra o executável do fcc-server de forma robusta.
   *
   * No Windows, o executável real pode ser .exe em .local/bin (ex: C:\Users\Jinfy\.local\bin\fcc-server.exe)
   * e não necessariamente .cmd. No Linux/Mac, é apenas 'fcc-server' no PATH.
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
   * Encontra o executável do fcc-claude (launcher oficial).
   */
  private async findFccClaudeExecutable(): Promise<string> {
    const isWindows = process.platform === 'win32'
    if (!isWindows) return 'fcc-claude'

    const { join } = await import('path')
    const { existsSync } = await import('fs')

    const candidates = [
      'fcc-claude.exe',
      join(process.env.LOCALAPPDATA || '', 'bin', 'fcc-claude.exe'),
      join(process.env.USERPROFILE || '', '.local', 'bin', 'fcc-claude.exe'),
      join(process.env.APPDATA || '', 'npm', 'fcc-claude.exe'),
      join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', 'fcc-claude.exe'),
    ]

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        console.log('[FreeClaudeProvider] Found fcc-claude at:', candidate)
        return candidate
      }
    }

    console.log('[FreeClaudeProvider] Using shell fallback for fcc-claude.exe')
    return 'fcc-claude.exe'
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
    const timestamp = new Date().toISOString()
    console.log(`[SEND 25] [${timestamp}] [main] FreeClaudeProvider.handleProviderOutput START`, { rawDataLength: rawData.length, bufferLength: this.messageBuffer.length })
    this.messageBuffer += rawData
    const lines = this.messageBuffer.split('\n')
    this.messageBuffer = lines.pop() || ''

    console.log(`[SEND 25] [${timestamp}] [main] FreeClaudeProvider.handleProviderOutput split into ${lines.length} lines, buffer remaining:`, this.messageBuffer.length)

    for (const line of lines) {
      if (!line.trim()) continue

      const parsed = this.parseStreamJson(line.trim())
      console.log(`[SEND 25] [${timestamp}] [main] FreeClaudeProvider.handleProviderOutput parsed:`, parsed)
      if (parsed?.text && this.dataCallback) {
        console.log(`[SEND 26] [${timestamp}] [main] FreeClaudeProvider.handleProviderOutput calling dataCallback`, { type: parsed.type, textLength: parsed.text.length })
        if (parsed.type === 'assistant') {
          this.dataCallback(parsed.text)
        } else if (parsed.type === 'system') {
          this.dataCallback(`\n[${parsed.text}]\n`)
        }
        // 'result': não reenviar o texto — já foi enviado via 'assistant'.
        // O 'result' só dispara responseCompleteCallback() (dentro de parseStreamJson),
        // que sinaliza fim de resposta; reenviar o texto aqui duplicava a mensagem na tela.
      }
    }
  }

  /**
   * Envia mensagem para o Claude CLI via ProcessManager → stdin.
   */
  async send(chatId: string, message: string, images?: string[]): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`[SEND 20] [${timestamp}] [main] FreeClaudeProvider.send() START`, { chatId, messageLength: message.length, imagesCount: images?.length || 0, providerId: this.getId() })
    const pm = this.processManager!
    if (!pm.isRunning('claude')) {
      console.error(`[SEND 20] [${timestamp}] [main] FreeClaudeProvider.send() FAILED: No active claude process or stdin not writable`)
      console.error(`[SEND 20] [${timestamp}] [main] FreeClaudeProvider.send() pm.isRunning("claude"):`, pm.isRunning('claude'))
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

    console.log(`[SEND 20] [${timestamp}] [main] FreeClaudeProvider.send() JSON payload to Claude:`, payload.slice(0, 200) + (payload.length > 200 ? '...' : ''))

    const success = pm.writeToProcess('claude', payload + '\n')
    if (!success) {
      console.error(`[SEND 21] [${timestamp}] [main] FreeClaudeProvider.send() FAILED: writeToProcess returned false`)
      throw new Error('Falha ao escrever no stdin do processo claude')
    }
    console.log(`[SEND 21] [${timestamp}] [main] FreeClaudeProvider.send() SUCCESS: payload written to stdin, bytes:`, Buffer.byteLength(payload + '\n'))
  }

  /**
   * Para o provider graciosamente via ProcessManager.
   *
   * Usa fila de operações (_opQueue) para serializar chamadas concorrentes.
   */
  async stop(): Promise<void> {
    const task = this._opQueue.then(async () => {
      console.log('[FreeClaudeProvider] Stopping... (queue)')

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

      // Limpar lock de inicialização do fcc-server se houver um em andamento
      this._fccServerInitPromise = null

      this.cleanupProcessManagerListeners()
      this.config = null
      this.messageBuffer = ''
      console.log('[FreeClaudeProvider] Stopped')
    })

    this._opQueue = task.catch(() => {})

    await task
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
    return (
      this.config !== null &&
      this.processManager?.isRunning('claude') === true &&
      this.processManager?.isRunning('fcc-server') === true
    )
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

  onHealthy(callback: () => void): () => void {
    this.healthyCallback = callback
    return () => {
      this.healthyCallback = null
    }
  }

  onResponseComplete(callback: () => void): () => void {
    this.responseCompleteCallback = callback
    return () => {
      this.responseCompleteCallback = null
    }
  }

  // ========== Parser NDJSON (reutilizado do ClaudeProvider) ==========

  /**
   * Parseia uma linha do stream JSON do claude CLI.
   * Formato: stream-json do Anthropic (NDJSON).
   */
  private parseStreamJson(line: string): { type: string; text?: string } | null {
    try {
      const parsed = JSON.parse(line)
      const timestamp = new Date().toISOString()
      console.log(`[SEND 25] [${timestamp}] [main] parseStreamJson PARSED`, { type: parsed.type, subtype: parsed.subtype, hasMessage: !!parsed.message, hasResult: !!parsed.result })

      // Tipo: assistant - conteúdo da resposta
      if (parsed.type === 'assistant' && parsed.message?.content) {
        const textContent = parsed.message.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        if (textContent) {
          console.log(`[SEND 25] [${timestamp}] [main] parseStreamJson ASSISTANT`, { textLength: textContent.length })
          return { type: 'assistant', text: textContent }
        }
        // Assistant message sem texto (ex.: só thinking) - ignorar silenciosamente
        console.log(`[SEND 25] [${timestamp}] [main] parseStreamJson ASSISTANT (no text content)`)
        return null
      }

      // Tipo: result - resultado final
      if (parsed.type === 'result' && parsed.result) {
        console.log(`[END 01] [${timestamp}] [main] parseStreamJson RESULT type detected, calling responseCompleteCallback`, { textLength: parsed.result.length })
        this.responseCompleteCallback?.()
        return { type: 'result', text: parsed.result }
      }

      // Tipo: system - mensagens do sistema
      if (parsed.type === 'system') {
        if (parsed.subtype === 'init') {
          // Ignore session init message - FCC/Claude Code handles its own initialization
          // Do not create artificial "Sessão iniciada" message
          console.log(`[SEND 25] [${timestamp}] [main] parseStreamJson SYSTEM_INIT ignored`)
          return null
        }
        if (parsed.subtype === 'thinking_tokens') {
          console.log(`[SEND 25] [${timestamp}] [main] parseStreamJson SYSTEM_THINKING`)
          // Retorna tipo 'thinking' com texto vazio para não disparar dataCallback
          // O callback de resposta completa será disparado pelo tipo 'result'
          return { type: 'thinking', text: '' }
        }
      }

      console.log(`[SEND 25] [${timestamp}] [main] parseStreamJson IGNORED type:`, parsed.type)
      return null
    } catch (error) {
      const timestamp = new Date().toISOString()
      console.warn(`[SEND 25] [${timestamp}] [main] parseStreamJson FAILED`, { linePreview: line.substring(0, 100), error: error instanceof Error ? error.message : String(error) })
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