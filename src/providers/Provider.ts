/**
 * Configuração passada para o Provider ao iniciar.
 */
export interface ProviderConfig {
  projectPath: string
  model: string
  effort: string
  webSearch: boolean
  // Campos extras podem ser adicionados conforme necessário por providers específicos
  [key: string]: any
}

/**
 * Interface padrão que TODOS os Providers de IA devem implementar.
 *
 * Princípios:
 * - Baixo acoplamento: App não conhece detalhes internos do provider
 * - Alta coesão: Cada provider encapsula TODA sua lógica de comunicação
 * - Interface única: Trocar provider não exige mudanças no resto do app
 * - Extensibilidade: Novos providers = apenas nova pasta em src/providers/
 */
export interface AIProvider {
  /**
   * Identificador único do provider (ex: 'claude', 'gemini', 'ollama')
   * Usado para seleção e persistência.
   */
  getId(): string

  /**
   * Nome amigável para exibição na UI.
   */
  getName(): string

  /**
   * Lista de modelos suportados por este provider.
   * Usado para popular o ModelSelector.
   */
  getSupportedModels(): string[]

  /**
   * Lista de níveis de effort suportados.
   * Usado para popular o EffortSelector.
   */
  getSupportedEfforts(): string[]

  /**
   * Se o provider suporta web search.
   */
  supportsWebSearch(): boolean

  /**
   * Se o provider suporta envio de imagens.
   */
  supportsImages(): boolean

  /**
   * Inicia o provider com a configuração dada.
   * Deve estabelecer conexão, autenticar se necessário, preparar para receber mensagens.
   */
  start(config: ProviderConfig): Promise<void>

  /**
   * Envia uma mensagem para o provider.
   * Deve suportar streaming de resposta via callbacks onData/onError/onExit.
   */
  send(chatId: string, message: string, images?: string[]): Promise<void>

  /**
   * Para o provider graciosamente.
   * Deve fechar conexões, liberar recursos.
   */
  stop(): Promise<void>

  /**
   * Reinicia o provider (stop + start com mesma config).
   */
  restart(): Promise<void>

  /**
   * Verifica se o provider está rodando ativamente.
   */
  isRunning(): boolean

  /**
   * Registra callback para dados de streaming (resposta do IA).
   * Retorna função de cleanup.
   */
  onData(callback: (data: string) => void): () => void

  /**
   * Registra callback para erros.
   * Retorna função de cleanup.
   */
  onError(callback: (error: string) => void): () => void

  /**
   * Registra callback para saída/encerramento do processo.
   * Retorna função de cleanup.
   */
  onExit(callback: (code: number) => void): () => void

  /**
   * Registra callback para quando o provider está totalmente pronto (processos spawneados e saudáveis).
   * Retorna função de cleanup.
   */
  onReady(callback: () => void): () => void

  /**
   * Registra callback para quando uma resposta completa é recebida do provider.
   * Útil para notificar que o streaming terminou.
   * Retorna função de cleanup.
   */
  onResponseComplete(callback: () => void): () => void
}

/**
 * Tipo para factory de providers.
 * Permite registro dinâmico de novos providers.
 * A factory recebe o manager para permitir comunicação bidirecional se necessário.
 */
export type ProviderFactory = (providerManager: ProviderManager) => AIProvider

/**
 * Manager responsável por:
 * - Registrar providers disponíveis
 * - Selecionar provider ativo
 * - Gerenciar lifecycle (start/stop/restart)
 * - Delegar mensagens para provider ativo
 * - Encaminhar eventos (data/error/exit) para listeners globais
 *
 * O App (main.ts, store, components) fala APENAS com o ProviderManager.
 * NUNCA diretamente com providers específicos.
 */
export class ProviderManager {
  private providers: Map<string, ProviderFactory> = new Map()
  private activeProvider: AIProvider | null = null
  private activeProviderId: string | null = null
  private activeConfig: ProviderConfig | null = null

  // Global listeners (do app/store)
  private dataListeners: Set<(data: string) => void> = new Set()
  private errorListeners: Set<(error: string) => void> = new Set()
  private exitListeners: Set<(code: number) => void> = new Set()
  private readyListeners: Set<() => void> = new Set()
  private responseCompleteListeners: Set<() => void> = new Set()

  // Provider-specific listener cleanups
  private activeDataCleanup: (() => void) | null = null
  private activeErrorCleanup: (() => void) | null = null
  private activeExitCleanup: (() => void) | null = null
  private activeReadyCleanup: (() => void) | null = null
  private activeResponseCompleteCleanup: (() => void) | null = null

  // ============================================
  // BUG C — serialização/idempotência de setActiveProvider
  // ============================================
  //
  // Antes desta correção, setActiveProvider() não tinha NENHUMA proteção
  // contra chamadas concorrentes ou duplicadas: cada chamada disparava
  // incondicionalmente stop() -> start(), mesmo se já houvesse uma
  // ativação idêntica em andamento ou já concluída. Isso permitia que
  // múltiplos caminhos (boot, IPC start-provider, IPC set-active-provider)
  // disparassem vários ciclos stop/start seguidos para o mesmo projeto,
  // e permitia que um stop() de uma chamada derrubasse um start() em
  // andamento de outra.
  //
  // A correção tem duas partes:
  // 1. Fila (_activationQueue): TODAS as chamadas de setActiveProvider são
  //    encadeadas nesta fila, não importa a origem. Uma segunda chamada
  //    que chegue enquanto a primeira ainda está no meio do stop()/start()
  //    aguarda a primeira terminar antes de rodar — nunca roda em paralelo.
  // 2. Idempotência (_setActiveProviderLocked): quando chega a vez de uma
  //    chamada rodar, ela verifica se o provider requisitado já é o ativo,
  //    para o MESMO projectPath, com a MESMA config relevante, e já está
  //    rodando. Se sim, é tratada como no-op explícito (skip), sem stop/start.
  private _activationQueue: Promise<void> = Promise.resolve()
  private _activationSeq = 0

  /**
   * Registra uma factory de provider.
   * A factory recebe o manager para permitir comunicação bidirecional se necessário.
   */
  registerProvider(id: string, factory: ProviderFactory): void {
    if (this.providers.has(id)) {
      console.warn(`[ProviderManager] Provider "${id}" jÃ¡ registrado, sobrescrevendo.`)
    }
    this.providers.set(id, factory)
    console.log(`[DEBUG] [ProviderManager] Provider registrado: ${id}`)
  }

  /**
   * ObtÃ©m provider por ID.
   */
  private instances = new Map<string, AIProvider>()

	getProvider(id:string) {
    console.log('[DEBUG] [ProviderManager] getProvider called for:', id)
    if (!this.instances.has(id)) {
        const factory = this.providers.get(id)
        if (!factory) {
          console.log('[DEBUG] [ProviderManager] getProvider - no factory for:', id)
          return undefined
        }

        console.log('[DEBUG] [ProviderManager] getProvider - creating new instance for:', id)
        this.instances.set(id, factory(this))
        console.log('[DEBUG] [ProviderManager] getProvider - instance created for:', id)
    }

    return this.instances.get(id)
  }

  /**
   * Lista todos os providers registrados.
   */
  getAllProviders(): AIProvider[] {
    const result: AIProvider[] = []
    for (const [, factory] of this.providers) {
      result.push(factory(this))
    }
    return result
  }

  /**
   * ObtÃ©m IDs de todos os providers.
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Lista providers registrados com nome amigÃ¡vel.
   */
  getRegisteredProviders(): Array<{ id: string; name: string }> {
    const result: Array<{ id: string; name: string }> = []
    for (const [id, factory] of this.providers) {
      const tempProvider = factory(this)
      result.push({ id, name: tempProvider.getName() })
    }
    return result
  }

  /**
   * Define o provider ativo.
   * Se houver provider ativo anterior E a ativação não for idempotente, para ele.
   * Reusa instância cacheada se já existir (para preservar injeções como ProcessManager).
   *
   * SERIALIZADA: encadeada em _activationQueue, então nunca roda em paralelo
   * com outra chamada de setActiveProvider (mesmo para providers/projetos diferentes).
   *
   * IDEMPOTENTE: se o provider requisitado já é o ativo, para o mesmo
   * projectPath, com a mesma config relevante (model/effort/webSearch), e já
   * está rodando, a chamada é um no-op explícito — não faz stop()/start() de novo.
   *
   * @param source Origem lógica da chamada (ex.: "ipc:start-provider",
   *   "ipc:set-active-provider", "app:boot"), propagada explicitamente desde
   *   quem chamou, para aparecer nos logs junto com o stack trace de origem.
   */
  async setActiveProvider(id: string, config?: ProviderConfig, source = 'unknown'): Promise<void> {
    const callId = ++this._activationSeq
    const originStack = new Error('setActiveProvider origin').stack

    console.log('[DEBUG] [ProviderManager] setActiveProvider QUEUED', {
      callId,
      id,
      projectPath: config?.projectPath,
      source,
      timestamp: new Date().toISOString(),
    })
    console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} origin stack:\n${originStack}`)

    // Encadeia na fila de ativações. Usamos .catch() ao reatribuir a fila
    // para que uma falha numa chamada NÃO "envenene" a fila inteira e trave
    // todas as ativações futuras (a chamada original ainda rejeita normalmente
    // para quem a await-ou, via `task` abaixo).
    const task = this._activationQueue.then(() =>
      this._setActiveProviderLocked(id, config, callId, source)
    )
    this._activationQueue = task.catch(() => {})

    return task
  }

  /**
   * Corpo real de setActiveProvider, só executado quando é a vez desta
   * chamada na fila de ativações (_activationQueue). Não deve ser chamado
   * diretamente de fora — sempre passe por setActiveProvider().
   */
  private async _setActiveProviderLocked(
    id: string,
    config: ProviderConfig | undefined,
    callId: number,
    source: string
  ): Promise<void> {
    const factory = this.providers.get(id)
    if (!factory) {
      throw new Error(`Provider "${id}" não encontrado. Providers disponíveis: ${this.getProviderIds().join(', ')}`)
    }

    // ---- Checagem de idempotência ----
    const sameProvider = this.activeProviderId === id
    const sameProject =
      !!config && !!this.activeConfig && this.activeConfig.projectPath === config.projectPath
    const sameRelevantConfig =
      !!config &&
      !!this.activeConfig &&
      this.activeConfig.model === config.model &&
      this.activeConfig.effort === config.effort &&
      this.activeConfig.webSearch === config.webSearch
    const alreadyRunning = this.activeProvider?.isRunning() ?? false

    // Caso 1: Provider IDÊNTICO, projeto IGUAL, config relevante IGUAL, já rodando -> SKIP total
    if (sameProvider && sameProject && sameRelevantConfig && alreadyRunning) {
      console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} SKIPPED (idempotente)`, {
        id,
        projectPath: config?.projectPath,
        source,
        reason: 'provider já ativo para o mesmo projeto/config e já rodando',
      })
      return
    }

    console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} EXECUTING`, {
      id,
      projectPath: config?.projectPath,
      source,
      reason: !sameProvider
        ? 'provider diferente do ativo'
        : !sameProject
          ? 'projectPath diferente (mesmo provider — delegando ao provider para reutilizar fcc-server)'
          : !sameRelevantConfig
            ? 'config relevante diferente (model/effort/webSearch — delegando ao provider)'
            : 'provider não está rodando',
    })

    // Caso 2: Provider DIFERENTE -> parar atual completamente
    if (!sameProvider && this.activeProvider) {
      console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} - stopping current provider (different provider)`)
      await this.stop()
    }
    // Caso 3: Mesmo provider, projectPath/config mudaram -> NÃO parar, delegar ao provider.start()
    // O provider (ex: FreeClaudeProvider) decide internamente o que reiniciar (fcc-claude) vs reutilizar (fcc-server)

    // Reusar instância cacheada se existir (preserva setProcessManagerRef), senão criar nova
    let provider = this.instances.get(id)
    if (!provider) {
      console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} - creating new provider instance`)
      provider = factory(this)
      this.instances.set(id, provider)
    } else {
      console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} - reusing cached instance`)
    }

    this.activeProvider = provider
    this.activeProviderId = id

    // Se config fornecida, iniciar (provider lida com idempotência interna)
    if (config) {
      console.log(`[DEBUG] [ProviderManager] setActiveProvider#${callId} - calling start with config`)
      await this.start(config)
    }

    console.log(`[ProviderManager] setActiveProvider#${callId} Provider ativo: ${this.activeProvider.getName()} (${id})`)
  }

  /**
   * ObtÃ©m o provider ativo atual.
   */
  getActiveProvider(): AIProvider | null {
    return this.activeProvider
  }

  /**
   * ObtÃ©m ID do provider ativo.
   */
  getActiveProviderId(): string | null {
    return this.activeProviderId
  }

  /**
   * Inicia o provider ativo com a configuraÃ§Ã£o.
   *
   * NOTA: Esta chamada Ã© idempotente no nÃ­vel do provider.
   * Cada provider deve implementar sua prÃ³pria lÃ³gica de reutilizaÃ§Ã£o
   * (ex.: FreeClaudeProvider reusa fcc-server singleton).
   */
  async start(config: ProviderConfig): Promise<void> {
    console.log('[DEBUG] [ProviderManager] start called')
    if (!this.activeProvider) {
      throw new Error('Nenhum provider ativo selecionado. Use setActiveProvider primeiro.')
    }

    this.activeConfig = config
    this.setupProviderListeners()

    console.log('[DEBUG] [ProviderManager] start - calling activeProvider.start()')
    await this.activeProvider.start(config)
    console.log(`[ProviderManager] Provider "${this.activeProvider.getId()}" iniciado.`)
  }

  /**
   * Envia mensagem para o provider ativo.
   */
  async send(chatId: string, message: string, images?: string[]): Promise<void> {
    const timestamp = new Date().toISOString()
    const providerId = this.activeProvider?.getId()
    console.log(`[SEND 19] [${timestamp}] [main] ProviderManager.send() START`, { providerId, chatId, messageLength: message.length, imagesCount: images?.length || 0 })
    if (!this.activeProvider) {
      throw new Error('Nenhum provider ativo. Selecione um provider primeiro.')
    }

    if (!this.activeProvider.isRunning()) {
      if (!this.activeConfig) {
        throw new Error('Provider não está rodando e não há configuração salva para reiniciar.')
      }
      // Auto-restart se parou inesperadamente
      console.log('[ProviderManager] Provider parou, reiniciando...')
      await this.activeProvider.start(this.activeConfig)
      this.setupProviderListeners()
    }

    await this.activeProvider.send(chatId, message, images)
    console.log(`[SEND 19] [${timestamp}] [main] ProviderManager.send() COMPLETED`)
  }

  /**
   * Para o provider ativo.
   */
  async stop(): Promise<void> {
    if (this.activeProvider) {
      this.cleanupProviderListeners()
      await this.activeProvider.stop()
      console.log(`[ProviderManager] Provider "${this.activeProvider.getId()}" parado.`)
    }
    this.activeProvider = null
    this.activeProviderId = null
    this.activeConfig = null
  }

  /**
   * Reinicia o provider ativo com a mesma configuraÃ§Ã£o.
   */
  async restart(): Promise<void> {
    if (!this.activeProvider || !this.activeConfig) {
      throw new Error('Nenhum provider ativo para reiniciar.')
    }
    await this.activeProvider.restart()
    this.setupProviderListeners()
  }

  /**
   * Verifica se hÃ¡ provider ativo rodando.
   */
  isRunning(): boolean {
    return this.activeProvider?.isRunning() ?? false
  }

  // ========== Global Event Listeners (para App/Store) ==========

  /**
   * Registra listener global para dados de streaming.
   * Retorna funÃ§Ã£o de cleanup.
   */
  onData(callback: (data: string) => void): () => void {
    this.dataListeners.add(callback)
    return () => this.dataListeners.delete(callback)
  }

  /**
   * Registra listener global para erros.
   * Retorna funÃ§Ã£o de cleanup.
   */
  onError(callback: (error: string) => void): () => void {
    this.errorListeners.add(callback)
    return () => this.errorListeners.delete(callback)
  }

  /**
   * Registra listener global para saÃ­da/encerramento.
   * Retorna funÃ§Ã£o de cleanup.
   */
  onExit(callback: (code: number) => void): () => void {
    this.exitListeners.add(callback)
    return () => this.exitListeners.delete(callback)
  }

  /**
   * Registra listener global para quando o provider está pronto.
   * Retorna função de cleanup.
   */
  onReady(callback: () => void): () => void {
    this.readyListeners.add(callback)
    return () => this.readyListeners.delete(callback)
  }

  /**
   * Registra listener global para quando uma resposta completa é recebida.
   * Retorna função de cleanup.
   */
  onResponseComplete(callback: () => void): () => void {
    this.responseCompleteListeners.add(callback)
    return () => this.responseCompleteListeners.delete(callback)
  }

  // ========== Internal ==========

  /**
   * Configura listeners do provider ativo para repassar eventos aos listeners globais.
   */
  private setupProviderListeners(): void {
    if (!this.activeProvider) return

    this.cleanupProviderListeners()

    this.activeDataCleanup = this.activeProvider.onData((data) => {
      const timestamp = new Date().toISOString()
      console.log(`[SEND 27] [${timestamp}] [main] ProviderManager.onData FORWARDING to ${this.dataListeners.size} global listeners`, { dataLength: data.length })
      this.dataListeners.forEach((cb) => cb(data))
    })

    this.activeErrorCleanup = this.activeProvider.onError((error) => {
      const timestamp = new Date().toISOString()
      console.log(`[SEND 27-ERR] [${timestamp}] [main] ProviderManager.onError FORWARDING to ${this.errorListeners.size} global listeners`)
      this.errorListeners.forEach((cb) => cb(error))
    })

    this.activeExitCleanup = this.activeProvider.onExit((code) => {
      const timestamp = new Date().toISOString()
      console.log(`[SEND 27-EXIT] [${timestamp}] [main] ProviderManager.onExit FORWARDING to ${this.exitListeners.size} global listeners`)
      this.exitListeners.forEach((cb) => cb(code))
      // Removido: cleanupProviderListeners() aqui zerava dataCallback/responseCompleteCallback/
      // readyCallback toda vez que restartClaudeCli() reiniciava SÓ o processo claude (troca de
      // projeto/model/effort), deixando o provider "surdo" pro resto da sessão (resposta chegava
      // no log mas nunca era encaminhada pra renderer). A limpeza de verdade já é feita em
      // ProviderManager.stop(), quando o provider é trocado por outro de fato.
    })

    this.activeReadyCleanup = this.activeProvider.onReady?.(() => {
      const timestamp = new Date().toISOString()
      console.log(`[END 03] [${timestamp}] [main] ProviderManager.onReady FORWARDING to ${this.readyListeners.size} global listeners`)
      this.readyListeners.forEach((cb) => cb())
    })

    this.activeResponseCompleteCleanup = this.activeProvider.onResponseComplete?.(() => {
      const timestamp = new Date().toISOString()
      console.log(`[END 03] [${timestamp}] [main] ProviderManager.onResponseComplete FORWARDING to ${this.responseCompleteListeners.size} global listeners`)
      this.responseCompleteListeners.forEach((cb) => cb())
    })
  }

  /**
   * Limpa listeners do provider ativo.
   */
  private cleanupProviderListeners(): void {
    if (this.activeDataCleanup) {
      this.activeDataCleanup()
      this.activeDataCleanup = null
    }
    if (this.activeErrorCleanup) {
      this.activeErrorCleanup()
      this.activeErrorCleanup = null
    }
    if (this.activeExitCleanup) {
      this.activeExitCleanup()
      this.activeExitCleanup = null
    }
    if (this.activeReadyCleanup) {
      this.activeReadyCleanup()
      this.activeReadyCleanup = null
    }
    if (this.activeResponseCompleteCleanup) {
      this.activeResponseCompleteCleanup()
      this.activeResponseCompleteCleanup = null
    }
  }
}

// Singleton global
export const providerManager = new ProviderManager()