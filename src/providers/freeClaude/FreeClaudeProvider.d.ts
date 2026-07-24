import { AIProvider, ProviderConfig, ProviderManager } from '../Provider';
import { ProcessManager } from '../../main/process/ProcessManager';
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
export declare class FreeClaudeProvider implements AIProvider {
    private config;
    private resolvedModelId;
    private processManager;
    private dataCallback;
    private errorCallback;
    private exitCallback;
    private messageBuffer;
    private pmCleanups;
    constructor(_providerManager: ProviderManager);
    getId(): string;
    getName(): string;
    getSupportedModels(): string[];
    getSupportedEfforts(): string[];
    supportsWebSearch(): boolean;
    supportsImages(): boolean;
    /**
     * Inicializa o provider para um projeto.
     * Spawna fcc-server e claude CLI via ProcessManager.
     */
    start(config: ProviderConfig): Promise<void>;
    /**
     * Injeta referência do ProcessManager (chamado pelo main.ts ANTES de start()).
     */
    setProcessManagerRef(pm: ProcessManager): void;
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
    private spawnFccServer;
    /**
     * Aguarda o fcc-server ficar saudável.
     */
    private waitForServerHealthy;
    /**
     * Spawna o Claude CLI apontando para o proxy local.
     */
    private spawnClaudeCli;
    /**
     * Constrói o comando para iniciar o Claude Code baseado na plataforma e configuração.
     *
     * CORRIGIDO: agora é async porque no Windows precisa aguardar
     * findClaudeExecutable(), que faz import dinâmico de 'path' e 'fs'.
     */
    private buildClaudeCommand;
    /**
     * Encontra o executável do Claude no Windows.
     *
     * CORRIGIDO: assinatura agora é `async ... Promise<string>` porque o corpo
     * usa `await import(...)`. Antes a função era declarada como síncrona
     * (`(): string`), o que não compila com `await` dentro dela.
     */
    private findClaudeExecutable;
    /**
     * Encontra o executável do fcc-server de forma robusta.
     *
     * No Windows, o executável real pode ser .exe em .local/bin (ex: C:\Users\Jinfy\.local\bin\fcc-server.exe)
     * e não necessariamente .cmd. No Linux/Mac, é apenas 'fcc-server' no PATH.
     * Esta função tenta localizar o executável completo antes de cair no fallback do shell.
     */
    private findFccServerExecutable;
    /**
     * Configura listeners do ProcessManager para receber stdout/stderr do processo "claude".
     */
    private setupProcessManagerListeners;
    /**
     * Processa output bruto do provider (NDJSON stream-json).
     * Parseia e chama callback de dados com apenas o texto.
     */
    private handleProviderOutput;
    /**
     * Envia mensagem para o Claude CLI via ProcessManager → stdin.
     */
    send(message: string, images?: string[]): Promise<void>;
    /**
     * Para o provider graciosamente via ProcessManager.
     */
    stop(): Promise<void>;
    /**
     * Reinicia o provider com mesma configuração.
     */
    restart(): Promise<void>;
    isRunning(): boolean;
    onData(callback: (data: string) => void): () => void;
    onError(callback: (error: string) => void): () => void;
    onExit(callback: (code: number) => void): () => void;
    getFreeProvider(): string | undefined;
    getResolvedModelId(): string;
    /**
     * Parseia uma linha do stream JSON do claude CLI.
     * Formato: stream-json do Anthropic (NDJSON).
     */
    private parseStreamJson;
    private cleanupProcessManagerListeners;
}
/**
 * Factory para registro no ProviderManager.
 */
export declare function createFreeClaudeProvider(providerManager: ProviderManager): FreeClaudeProvider;
export type { FreeClaudeConfig, FreeClaudeProviderId, } from './FreeClaudeConfig';
export { DEFAULT_FREE_CLAUDE_CONFIG, } from './FreeClaudeConfig';
export { getSupportedModelsForProvider, getModelLabel, getModelDescription, resolveModelId, } from './modelMapping';
//# sourceMappingURL=FreeClaudeProvider.d.ts.map