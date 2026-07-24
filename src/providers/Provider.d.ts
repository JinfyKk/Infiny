/**
 * Configuração passada para o Provider ao iniciar.
 */
export interface ProviderConfig {
    projectPath: string;
    model: string;
    effort: string;
    webSearch: boolean;
    [key: string]: any;
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
    getId(): string;
    /**
     * Nome amigável para exibição na UI.
     */
    getName(): string;
    /**
     * Lista de modelos suportados por este provider.
     * Usado para popular o ModelSelector.
     */
    getSupportedModels(): string[];
    /**
     * Lista de níveis de effort suportados.
     * Usado para popular o EffortSelector.
     */
    getSupportedEfforts(): string[];
    /**
     * Se o provider suporta web search.
     */
    supportsWebSearch(): boolean;
    /**
     * Se o provider suporta envio de imagens.
     */
    supportsImages(): boolean;
    /**
     * Inicia o provider com a configuração dada.
     * Deve estabelecer conexão, autenticar se necessário, preparar para receber mensagens.
     */
    start(config: ProviderConfig): Promise<void>;
    /**
     * Envia uma mensagem para o provider.
     * Deve suportar streaming de resposta via callbacks onData/onError/onExit.
     */
    send(message: string, images?: string[]): Promise<void>;
    /**
     * Para o provider graciosamente.
     * Deve fechar conexões, liberar recursos.
     */
    stop(): Promise<void>;
    /**
     * Reinicia o provider (stop + start com mesma config).
     */
    restart(): Promise<void>;
    /**
     * Verifica se o provider está rodando ativamente.
     */
    isRunning(): boolean;
    /**
     * Registra callback para dados de streaming (resposta do IA).
     * Retorna função de cleanup.
     */
    onData(callback: (data: string) => void): () => void;
    /**
     * Registra callback para erros.
     * Retorna função de cleanup.
     */
    onError(callback: (error: string) => void): () => void;
    /**
     * Registra callback para saída/encerramento do processo.
     * Retorna função de cleanup.
     */
    onExit(callback: (code: number) => void): () => void;
}
/**
 * Tipo para factory de providers.
 * Permite registro dinâmico de novos providers.
 * A factory recebe o manager para permitir comunicação bidirecional se necessário.
 */
export type ProviderFactory = (providerManager: ProviderManager) => AIProvider;
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
export declare class ProviderManager {
    private providers;
    private activeProvider;
    private activeProviderId;
    private activeConfig;
    private dataListeners;
    private errorListeners;
    private exitListeners;
    private activeDataCleanup;
    private activeErrorCleanup;
    private activeExitCleanup;
    /**
     * Registra uma factory de provider.
     * A factory recebe o manager para permitir comunicação bidirecional se necessário.
     */
    registerProvider(id: string, factory: ProviderFactory): void;
    /**
     * ObtÃ©m provider por ID.
     */
    private instances;
    getProvider(id: string): AIProvider | undefined;
    /**
     * Lista todos os providers registrados.
     */
    getAllProviders(): AIProvider[];
    /**
     * ObtÃ©m IDs de todos os providers.
     */
    getProviderIds(): string[];
    /**
     * Lista providers registrados com nome amigÃ¡vel.
     */
    getRegisteredProviders(): Array<{
        id: string;
        name: string;
    }>;
    /**
     * Define o provider ativo.
     * Se houver provider ativo anterior, para ele.
     * Reusa instância cacheada se já existir (para preservar injeções como ProcessManager).
     */
    setActiveProvider(id: string, config?: ProviderConfig): Promise<void>;
    /**
     * ObtÃ©m o provider ativo atual.
     */
    getActiveProvider(): AIProvider | null;
    /**
     * ObtÃ©m ID do provider ativo.
     */
    getActiveProviderId(): string | null;
    /**
     * Inicia o provider ativo com a configuraÃ§Ã£o.
     */
    start(config: ProviderConfig): Promise<void>;
    /**
     * Envia mensagem para o provider ativo.
     */
    send(message: string, images?: string[]): Promise<void>;
    /**
     * Para o provider ativo.
     */
    stop(): Promise<void>;
    /**
     * Reinicia o provider ativo com a mesma configuraÃ§Ã£o.
     */
    restart(): Promise<void>;
    /**
     * Verifica se hÃ¡ provider ativo rodando.
     */
    isRunning(): boolean;
    /**
     * Registra listener global para dados de streaming.
     * Retorna funÃ§Ã£o de cleanup.
     */
    onData(callback: (data: string) => void): () => void;
    /**
     * Registra listener global para erros.
     * Retorna funÃ§Ã£o de cleanup.
     */
    onError(callback: (error: string) => void): () => void;
    /**
     * Registra listener global para saÃ­da/encerramento.
     * Retorna funÃ§Ã£o de cleanup.
     */
    onExit(callback: (code: number) => void): () => void;
    /**
     * Configura listeners do provider ativo para repassar eventos aos listeners globais.
     */
    private setupProviderListeners;
    /**
     * Limpa listeners do provider ativo.
     */
    private cleanupProviderListeners;
}
export declare const providerManager: ProviderManager;
//# sourceMappingURL=Provider.d.ts.map