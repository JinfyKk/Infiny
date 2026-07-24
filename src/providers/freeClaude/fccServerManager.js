"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FCCServerManager = void 0;
const FreeClaudeConfig_1 = require("./FreeClaudeConfig");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Gerencia o ciclo de vida do fcc-server (proxy local do free-claude-code).
 * Encapsula spawn, health check, e cleanup do processo do servidor proxy.
 */
class FCCServerManager {
    constructor(config) {
        this.process = null;
        this.started = false;
        this.startPromise = null;
        this.config = { ...FreeClaudeConfig_1.DEFAULT_FREE_CLAUDE_CONFIG, ...config };
        this.host = this.config.proxyHost ?? '127.0.0.1';
        this.port = this.config.proxyPort ?? this.findFreePort();
    }
    /**
     * Inicia o fcc-server e aguarda health check.
     * Retorna a URL base do proxy (ex: http://127.0.0.1:8082/v1).
     */
    async start() {
        // Evita múltiplas inicializações concorrentes
        if (this.startPromise) {
            await this.startPromise;
            return this.getBaseUrl();
        }
        this.startPromise = this.doStart();
        await this.startPromise;
        return this.getBaseUrl();
    }
    async doStart() {
        if (this.process) {
            console.log('[FCCServerManager] Servidor já rodando');
            return;
        }
        // 1. Encontrar executável fcc-server
        const fccServerPath = await this.findFCCServerExecutable();
        if (!fccServerPath) {
            throw new Error('fcc-server não encontrado. Instale free-claude-code: `uv tool install free-claude-code` ou `pipx install free-claude-code`');
        }
        // 2. Preparar argumentos
        const args = this.buildServerArgs();
        const options = this.buildSpawnOptions();
        console.log('[FCCServerManager] Iniciando:', fccServerPath, args.join(' '));
        console.log('[FCCServerManager] Diretório de trabalho:', options.cwd);
        // 3. Spawn do processo
        this.process = (0, child_process_1.spawn)(fccServerPath, args, options);
        // 4. Configurar handlers de saída
        this.setupProcessHandlers();
        // 5. Aguardar health check
        await this.waitForHealthCheck();
        this.started = true;
        console.log('[FCCServerManager] Servidor pronto em', this.getBaseUrl());
    }
    /**
     * Encontra o executável fcc-server no sistema.
     */
    async findFCCServerExecutable() {
        const isWindows = process.platform === 'win32';
        const candidates = [];
        // Caminho customizado na config
        if (this.config.fccServerPath) {
            candidates.push(this.config.fccServerPath);
        }
        // Nomes padrão
        const baseName = isWindows ? 'fcc-server.exe' : 'fcc-server';
        candidates.push(baseName);
        // Caminhos comuns de instalação uv/pipx
        const home = process.env.USERPROFILE || process.env.HOME || '';
        const appData = process.env.APPDATA || '';
        const localAppData = process.env.LOCALAPPDATA || '';
        if (isWindows) {
            candidates.push((0, path_1.join)(appData, 'uv', 'tools', 'free-claude-code', 'Scripts', 'fcc-server.exe'), (0, path_1.join)(localAppData, 'pipx', 'venvs', 'free-claude-code', 'Scripts', 'fcc-server.exe'), (0, path_1.join)(home, '.local', 'bin', 'fcc-server.exe'));
        }
        else {
            candidates.push((0, path_1.join)(home, '.local', 'bin', 'fcc-server'), (0, path_1.join)(home, '.cargo', 'bin', 'fcc-server'), // se instalado via cargo
            '/usr/local/bin/fcc-server', '/opt/homebrew/bin/fcc-server');
        }
        // Verificar cada candidato
        for (const candidate of candidates) {
            if ((0, fs_1.existsSync)(candidate)) {
                console.log('[FCCServerManager] Encontrado fcc-server em:', candidate);
                return candidate;
            }
        }
        // Tentar no PATH (spawn com shell)
        console.log('[FCCServerManager] Tentando fcc-server via PATH/shell');
        return baseName; // spawn com shell=true tentará encontrar no PATH
    }
    /**
     * Constrói argumentos para o fcc-server.
     */
    buildServerArgs() {
        const args = [
            '--host', this.host,
            '--port', String(this.port),
        ];
        // Provedor gratuito (se especificado)
        if (this.config.freeProvider) {
            args.push('--provider', this.config.freeProvider);
        }
        // API Key (se especificada)
        if (this.config.apiKey) {
            args.push('--api-key', this.config.apiKey);
        }
        // Argumentos extras da config
        if (this.config.fccServerArgs && this.config.fccServerArgs.length > 0) {
            args.push(...this.config.fccServerArgs);
        }
        return args;
    }
    /**
     * Constrói opções de spawn.
     */
    buildSpawnOptions() {
        const isWindows = process.platform === 'win32';
        const useShell = isWindows; // Windows precisa shell para resolver .exe no PATH
        return {
            cwd: this.config.projectPath || process.cwd(),
            env: {
                ...process.env,
                // Configurações do free-claude-code
                FCC_PROVIDER: this.config.freeProvider || '',
                FCC_API_KEY: this.config.apiKey || '',
                FCC_MODEL_MAPPING: this.config.modelMapping
                    ? JSON.stringify(this.config.modelMapping)
                    : '',
            },
            shell: useShell,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'], // stdin ignorado, stdout/stderr capturados
        };
    }
    /**
     * Configura handlers de stdout/stderr/exit do processo do servidor.
     */
    setupProcessHandlers() {
        if (!this.process)
            return;
        this.process.stdout?.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log('[FCCServerManager stdout]', output);
            }
        });
        this.process.stderr?.on('data', (data) => {
            const error = data.toString().trim();
            if (error) {
                console.error('[FCCServerManager stderr]', error);
            }
        });
        this.process.on('close', (code) => {
            console.log('[FCCServerManager] Servidor encerrado com código:', code);
            this.process = null;
            this.started = false;
            this.startPromise = null;
        });
        this.process.on('error', (err) => {
            console.error('[FCCServerManager] Erro no processo:', err);
            this.process = null;
            this.started = false;
            this.startPromise = null;
        });
    }
    /**
     * Aguarda health check do servidor (HTTP GET /health ou /v1/models).
     */
    async waitForHealthCheck() {
        const timeout = this.config.healthCheckTimeout ?? 10000;
        const startTime = Date.now();
        const healthUrls = [
            `http://${this.host}:${this.port}/health`,
            `http://${this.host}:${this.port}/v1/models`,
            `http://${this.host}:${this.port}/`,
        ];
        while (Date.now() - startTime < timeout) {
            for (const url of healthUrls) {
                try {
                    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(2000) });
                    if (response.ok || response.status === 404) {
                        // 404 em /v1/models é OK - significa que servidor responde
                        console.log('[FCCServerManager] Health check OK:', url);
                        return;
                    }
                }
                catch {
                    // Ignorar erros de conexão, tentar próximo
                }
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        throw new Error(`Timeout aguardando fcc-server ficar pronto (${timeout}ms). ` +
            `Verifique logs em [FCCServerManager stderr]. Porta: ${this.port}`);
    }
    /**
     * Encontra porta livre no range 8080-8090.
     */
    findFreePort() {
        // Por simplicidade, usa porta fixa inicial + offset aleatório
        // Em produção, deveria verificar disponibilidade real
        return 8080 + Math.floor(Math.random() * 10);
    }
    /**
     * Retorna URL base do proxy (ex: http://127.0.0.1:8082/v1).
     */
    getBaseUrl() {
        return `http://${this.host}:${this.port}/v1`;
    }
    /**
     * Retorna porta em uso.
     */
    getPort() {
        return this.port;
    }
    /**
     * Retorna host em uso.
     */
    getHost() {
        return this.host;
    }
    /**
     * Verifica se servidor está rodando.
     */
    isRunning() {
        return this.started && this.process !== null;
    }
    /**
     * Para o servidor graciosamente.
     */
    async stop() {
        if (this.process) {
            console.log('[FCCServerManager] Parando servidor...');
            this.process.kill('SIGINT');
            this.process = null;
            this.started = false;
            // Aguardar um pouco para processo terminar
            await new Promise((r) => setTimeout(r, 500));
        }
        this.startPromise = null;
    }
    /**
     * Força parada imediata (SIGKILL).
     */
    async kill() {
        if (this.process) {
            console.log('[FCCServerManager] Matando servidor (SIGKILL)...');
            this.process.kill('SIGKILL');
            this.process = null;
            this.started = false;
        }
        this.startPromise = null;
    }
}
exports.FCCServerManager = FCCServerManager;
//# sourceMappingURL=fccServerManager.js.map