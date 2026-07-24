import { FreeClaudeConfig } from './FreeClaudeConfig';
/**
 * Gerencia o ciclo de vida do fcc-server (proxy local do free-claude-code).
 * Encapsula spawn, health check, e cleanup do processo do servidor proxy.
 */
export declare class FCCServerManager {
    private process;
    private config;
    private port;
    private host;
    private started;
    private startPromise;
    constructor(config: FreeClaudeConfig);
    /**
     * Inicia o fcc-server e aguarda health check.
     * Retorna a URL base do proxy (ex: http://127.0.0.1:8082/v1).
     */
    start(): Promise<string>;
    private doStart;
    /**
     * Encontra o executável fcc-server no sistema.
     */
    private findFCCServerExecutable;
    /**
     * Constrói argumentos para o fcc-server.
     */
    private buildServerArgs;
    /**
     * Constrói opções de spawn.
     */
    private buildSpawnOptions;
    /**
     * Configura handlers de stdout/stderr/exit do processo do servidor.
     */
    private setupProcessHandlers;
    /**
     * Aguarda health check do servidor (HTTP GET /health ou /v1/models).
     */
    private waitForHealthCheck;
    /**
     * Encontra porta livre no range 8080-8090.
     */
    private findFreePort;
    /**
     * Retorna URL base do proxy (ex: http://127.0.0.1:8082/v1).
     */
    getBaseUrl(): string;
    /**
     * Retorna porta em uso.
     */
    getPort(): number;
    /**
     * Retorna host em uso.
     */
    getHost(): string;
    /**
     * Verifica se servidor está rodando.
     */
    isRunning(): boolean;
    /**
     * Para o servidor graciosamente.
     */
    stop(): Promise<void>;
    /**
     * Força parada imediata (SIGKILL).
     */
    kill(): Promise<void>;
}
//# sourceMappingURL=fccServerManager.d.ts.map