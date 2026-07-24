import { AIProvider, ProviderConfig, ProviderManager } from '../Provider';
/**
 * Provider para Claude Code (Anthropic).
 *
 * Encapsula toda a lógica de comunicação com o CLI do Claude Code:
 * - Spawn do processo
 * - Parsing de stream JSON
 * - Gerenciamento de stdin/stdout/stderr
 * - Suporte cross-platform (Windows, Linux, macOS)
 * - Configuração de modelo, effort, web search
 */
export declare class ClaudeProvider implements AIProvider {
    private process;
    private config;
    private messageBuffer;
    private dataCallback;
    private errorCallback;
    private exitCallback;
    constructor(_providerManager: ProviderManager);
    getId(): string;
    getName(): string;
    getSupportedModels(): string[];
    getSupportedEfforts(): string[];
    supportsWebSearch(): boolean;
    supportsImages(): boolean;
    start(config: ProviderConfig): Promise<void>;
    send(message: string, images?: string[]): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    isRunning(): boolean;
    onData(callback: (data: string) => void): () => void;
    onError(callback: (error: string) => void): () => void;
    onExit(callback: (code: number) => void): () => void;
    /**
     * Encontra o executável do Claude no Windows.
     */
    private findClaudeExecutable;
    /**
     * Constrói o comando para iniciar o Claude Code baseado na plataforma e configuração.
     */
    private getClaudeCommand;
    /**
     * Parseia uma linha do stream JSON do Claude Code.
     * Retorna objeto padronizado ou null se não for relevante.
     */
    private parseStreamJson;
}
//# sourceMappingURL=ClaudeProvider.d.ts.map