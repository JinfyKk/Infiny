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
  send(message: string, images?: string[]): Promise<void>

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

  // Provider-specific listener cleanups
  private activeDataCleanup: (() => void) | null = null
  private activeErrorCleanup: (() => void) | null = null
  private activeExitCleanup: (() => void) | null = null

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
   * Se houver provider ativo anterior, para ele.
   * Reusa instância cacheada se já existir (para preservar injeções como ProcessManager).
   */
  async setActiveProvider(id: string, config?: ProviderConfig): Promise<void> {
    console.log('[DEBUG] [ProviderManager] setActiveProvider called for:', id)
    const factory = this.providers.get(id)
    if (!factory) {
      throw new Error(`Provider "${id}" não encontrado. Providers disponíveis: ${this.getProviderIds().join(', ')}`)
    }

    // Parar provider atual se houver
    if (this.activeProvider) {
      console.log('[DEBUG] [ProviderManager] setActiveProvider - stopping current provider')
      await this.stop()
    }

    // Reusar instância cacheada se existir (preserva setProcessManagerRef), senão criar nova
    let provider = this.instances.get(id)
    if (!provider) {
      console.log('[DEBUG] [ProviderManager] setActiveProvider - creating new provider instance')
      provider = factory(this)
      this.instances.set(id, provider)
    } else {
      console.log('[DEBUG] [ProviderManager] setActiveProvider - reusing cached instance')
    }

    this.activeProvider = provider
    this.activeProviderId = id

    // Se config fornecida, iniciar
    if (config) {
      console.log('[DEBUG] [ProviderManager] setActiveProvider - calling start with config')
      await this.start(config)
    }

    console.log(`[ProviderManager] Provider ativo: ${this.activeProvider.getName()} (${id})`)
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
  async send(message: string, images?: string[]): Promise<void> {
    console.log('[ProviderManager] send() - START, provider:', this.activeProvider?.getId())
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

    await this.activeProvider.send(message, images)
    console.log('[ProviderManager] send() - COMPLETED')
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

  // ========== Internal ==========

  /**
   * Configura listeners do provider ativo para repassar eventos aos listeners globais.
   */
  private setupProviderListeners(): void {
    if (!this.activeProvider) return

    this.cleanupProviderListeners()

    this.activeDataCleanup = this.activeProvider.onData((data) => {
      this.dataListeners.forEach((cb) => cb(data))
    })

    this.activeErrorCleanup = this.activeProvider.onError((error) => {
      this.errorListeners.forEach((cb) => cb(error))
    })

    this.activeExitCleanup = this.activeProvider.onExit((code) => {
      this.exitListeners.forEach((cb) => cb(code))
      // Auto-cleanup quando provider para
      this.cleanupProviderListeners()
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
  }
}

// Singleton global
export const providerManager = new ProviderManager()