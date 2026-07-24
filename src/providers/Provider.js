"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerManager = exports.ProviderManager = void 0;
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
class ProviderManager {
    constructor() {
        this.providers = new Map();
        this.activeProvider = null;
        this.activeProviderId = null;
        this.activeConfig = null;
        // Global listeners (do app/store)
        this.dataListeners = new Set();
        this.errorListeners = new Set();
        this.exitListeners = new Set();
        // Provider-specific listener cleanups
        this.activeDataCleanup = null;
        this.activeErrorCleanup = null;
        this.activeExitCleanup = null;
        /**
         * ObtÃ©m provider por ID.
         */
        this.instances = new Map();
    }
    /**
     * Registra uma factory de provider.
     * A factory recebe o manager para permitir comunicação bidirecional se necessário.
     */
    registerProvider(id, factory) {
        if (this.providers.has(id)) {
            console.warn(`[ProviderManager] Provider "${id}" jÃ¡ registrado, sobrescrevendo.`);
        }
        this.providers.set(id, factory);
        console.log(`[DEBUG] [ProviderManager] Provider registrado: ${id}`);
    }
    getProvider(id) {
        console.log('[DEBUG] [ProviderManager] getProvider called for:', id);
        if (!this.instances.has(id)) {
            const factory = this.providers.get(id);
            if (!factory) {
                console.log('[DEBUG] [ProviderManager] getProvider - no factory for:', id);
                return undefined;
            }
            console.log('[DEBUG] [ProviderManager] getProvider - creating new instance for:', id);
            this.instances.set(id, factory(this));
            console.log('[DEBUG] [ProviderManager] getProvider - instance created for:', id);
        }
        return this.instances.get(id);
    }
    /**
     * Lista todos os providers registrados.
     */
    getAllProviders() {
        const result = [];
        for (const [, factory] of this.providers) {
            result.push(factory(this));
        }
        return result;
    }
    /**
     * ObtÃ©m IDs de todos os providers.
     */
    getProviderIds() {
        return Array.from(this.providers.keys());
    }
    /**
     * Lista providers registrados com nome amigÃ¡vel.
     */
    getRegisteredProviders() {
        const result = [];
        for (const [id, factory] of this.providers) {
            const tempProvider = factory(this);
            result.push({ id, name: tempProvider.getName() });
        }
        return result;
    }
    /**
     * Define o provider ativo.
     * Se houver provider ativo anterior, para ele.
     * Reusa instância cacheada se já existir (para preservar injeções como ProcessManager).
     */
    async setActiveProvider(id, config) {
        console.log('[DEBUG] [ProviderManager] setActiveProvider called for:', id);
        const factory = this.providers.get(id);
        if (!factory) {
            throw new Error(`Provider "${id}" não encontrado. Providers disponíveis: ${this.getProviderIds().join(', ')}`);
        }
        // Parar provider atual se houver
        if (this.activeProvider) {
            console.log('[DEBUG] [ProviderManager] setActiveProvider - stopping current provider');
            await this.stop();
        }
        // Reusar instância cacheada se existir (preserva setProcessManagerRef), senão criar nova
        let provider = this.instances.get(id);
        if (!provider) {
            console.log('[DEBUG] [ProviderManager] setActiveProvider - creating new provider instance');
            provider = factory(this);
            this.instances.set(id, provider);
        }
        else {
            console.log('[DEBUG] [ProviderManager] setActiveProvider - reusing cached instance');
        }
        this.activeProvider = provider;
        this.activeProviderId = id;
        // Se config fornecida, iniciar
        if (config) {
            console.log('[DEBUG] [ProviderManager] setActiveProvider - calling start with config');
            await this.start(config);
        }
        console.log(`[ProviderManager] Provider ativo: ${this.activeProvider.getName()} (${id})`);
    }
    /**
     * ObtÃ©m o provider ativo atual.
     */
    getActiveProvider() {
        return this.activeProvider;
    }
    /**
     * ObtÃ©m ID do provider ativo.
     */
    getActiveProviderId() {
        return this.activeProviderId;
    }
    /**
     * Inicia o provider ativo com a configuraÃ§Ã£o.
     */
    async start(config) {
        console.log('[DEBUG] [ProviderManager] start called');
        if (!this.activeProvider) {
            throw new Error('Nenhum provider ativo selecionado. Use setActiveProvider primeiro.');
        }
        this.activeConfig = config;
        this.setupProviderListeners();
        console.log('[DEBUG] [ProviderManager] start - calling activeProvider.start()');
        await this.activeProvider.start(config);
        console.log(`[ProviderManager] Provider "${this.activeProvider.getId()}" iniciado.`);
    }
    /**
     * Envia mensagem para o provider ativo.
     */
    async send(message, images) {
        if (!this.activeProvider) {
            throw new Error('Nenhum provider ativo. Selecione um provider primeiro.');
        }
        if (!this.activeProvider.isRunning()) {
            if (!this.activeConfig) {
                throw new Error('Provider nÃ£o estÃ¡ rodando e nÃ£o hÃ¡ configuraÃ§Ã£o salva para reiniciar.');
            }
            // Auto-restart se parou inesperadamente
            console.log('[ProviderManager] Provider parou, reiniciando...');
            await this.activeProvider.start(this.activeConfig);
            this.setupProviderListeners();
        }
        await this.activeProvider.send(message, images);
    }
    /**
     * Para o provider ativo.
     */
    async stop() {
        if (this.activeProvider) {
            this.cleanupProviderListeners();
            await this.activeProvider.stop();
            console.log(`[ProviderManager] Provider "${this.activeProvider.getId()}" parado.`);
        }
        this.activeProvider = null;
        this.activeProviderId = null;
        this.activeConfig = null;
    }
    /**
     * Reinicia o provider ativo com a mesma configuraÃ§Ã£o.
     */
    async restart() {
        if (!this.activeProvider || !this.activeConfig) {
            throw new Error('Nenhum provider ativo para reiniciar.');
        }
        await this.activeProvider.restart();
        this.setupProviderListeners();
    }
    /**
     * Verifica se hÃ¡ provider ativo rodando.
     */
    isRunning() {
        return this.activeProvider?.isRunning() ?? false;
    }
    // ========== Global Event Listeners (para App/Store) ==========
    /**
     * Registra listener global para dados de streaming.
     * Retorna funÃ§Ã£o de cleanup.
     */
    onData(callback) {
        this.dataListeners.add(callback);
        return () => this.dataListeners.delete(callback);
    }
    /**
     * Registra listener global para erros.
     * Retorna funÃ§Ã£o de cleanup.
     */
    onError(callback) {
        this.errorListeners.add(callback);
        return () => this.errorListeners.delete(callback);
    }
    /**
     * Registra listener global para saÃ­da/encerramento.
     * Retorna funÃ§Ã£o de cleanup.
     */
    onExit(callback) {
        this.exitListeners.add(callback);
        return () => this.exitListeners.delete(callback);
    }
    // ========== Internal ==========
    /**
     * Configura listeners do provider ativo para repassar eventos aos listeners globais.
     */
    setupProviderListeners() {
        if (!this.activeProvider)
            return;
        this.cleanupProviderListeners();
        this.activeDataCleanup = this.activeProvider.onData((data) => {
            this.dataListeners.forEach((cb) => cb(data));
        });
        this.activeErrorCleanup = this.activeProvider.onError((error) => {
            this.errorListeners.forEach((cb) => cb(error));
        });
        this.activeExitCleanup = this.activeProvider.onExit((code) => {
            this.exitListeners.forEach((cb) => cb(code));
            // Auto-cleanup quando provider para
            this.cleanupProviderListeners();
        });
    }
    /**
     * Limpa listeners do provider ativo.
     */
    cleanupProviderListeners() {
        if (this.activeDataCleanup) {
            this.activeDataCleanup();
            this.activeDataCleanup = null;
        }
        if (this.activeErrorCleanup) {
            this.activeErrorCleanup();
            this.activeErrorCleanup = null;
        }
        if (this.activeExitCleanup) {
            this.activeExitCleanup();
            this.activeExitCleanup = null;
        }
    }
}
exports.ProviderManager = ProviderManager;
// Singleton global
exports.providerManager = new ProviderManager();
//# sourceMappingURL=Provider.js.map