"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
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
class ClaudeProvider {
    constructor(_providerManager) {
        this.process = null;
        this.config = null;
        this.messageBuffer = '';
        this.dataCallback = null;
        this.errorCallback = null;
        this.exitCallback = null;
    }
    getId() {
        return 'claude';
    }
    getName() {
        return 'Claude Code';
    }
    getSupportedModels() {
        return [
            'claude-fable-5',
            'claude-opus-4-8',
            'claude-sonnet-5',
            'claude-haiku-4-5-20251001',
            'claude-haiku-4-5',
        ];
    }
    getSupportedEfforts() {
        return ['low', 'medium', 'high', 'max', 'xhigh'];
    }
    supportsWebSearch() {
        return true;
    }
    supportsImages() {
        return true;
    }
    async start(config) {
        this.config = config;
        if (this.process) {
            this.process.kill();
        }
        this.messageBuffer = '';
        const { command, args, options } = this.getClaudeCommand(config);
        console.log('[ClaudeProvider] Starting:', command, args.join(' '));
        console.log('[ClaudeProvider] Working directory:', config.projectPath);
        console.log('[ClaudeProvider] Platform:', process.platform);
        this.process = (0, child_process_1.spawn)(command, args, options);
        this.process.stdout?.on('data', (data) => {
            const output = data.toString();
            console.log('[ClaudeProvider] stdout:', output.substring(0, 500));
            this.messageBuffer += output;
            const lines = this.messageBuffer.split('\n');
            this.messageBuffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim()) {
                    const parsed = this.parseStreamJson(line.trim());
                    if (parsed?.text && this.dataCallback) {
                        if (parsed.type === 'assistant' || parsed.type === 'result') {
                            this.dataCallback(parsed.text);
                        }
                        else if (parsed.type === 'system') {
                            this.dataCallback(`\n[${parsed.text}]\n`);
                        }
                    }
                }
            }
        });
        this.process.stderr?.on('data', (data) => {
            const error = data.toString();
            console.error('[ClaudeProvider] stderr:', error);
            if (this.errorCallback) {
                this.errorCallback(error);
            }
        });
        this.process.on('close', (code) => {
            console.log('[ClaudeProvider] Process exited with code:', code);
            if (this.exitCallback) {
                this.exitCallback(code ?? 0);
            }
            this.process = null;
        });
        this.process.on('error', (err) => {
            console.error('[ClaudeProvider] Failed to start process:', err);
            if (this.errorCallback) {
                this.errorCallback(`Erro ao iniciar Claude: ${err.message}`);
            }
            if (this.exitCallback) {
                this.exitCallback(1);
            }
            this.process = null;
        });
    }
    async send(message, images) {
        if (!this.process || !this.process.stdin?.writable) {
            console.error('[ClaudeProvider] No active process or stdin not writable');
            throw new Error('Processo Claude não está rodando');
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
            : JSON.stringify({ type: 'user', message: { role: 'user', content: message } });
        console.log('[ClaudeProvider] Sending:', payload.substring(0, 200));
        try {
            this.process.stdin.write(payload + '\n');
        }
        catch (err) {
            console.error('[ClaudeProvider] Failed to write to stdin:', err);
            throw err;
        }
    }
    async stop() {
        if (this.process) {
            console.log('[ClaudeProvider] Stopping process');
            this.process.kill('SIGINT');
            this.process = null;
        }
    }
    async restart() {
        if (!this.config) {
            throw new Error('Não há configuração salva para reiniciar');
        }
        await this.stop();
        // Aguardar um pouco para o processo terminar
        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.start(this.config);
    }
    isRunning() {
        return this.process !== null;
    }
    onData(callback) {
        this.dataCallback = callback;
        return () => {
            this.dataCallback = null;
        };
    }
    onError(callback) {
        this.errorCallback = callback;
        return () => {
            this.errorCallback = null;
        };
    }
    onExit(callback) {
        this.exitCallback = callback;
        return () => {
            this.exitCallback = null;
        };
    }
    /**
     * Encontra o executável do Claude no Windows.
     */
    findClaudeExecutable() {
        const isWindows = process.platform === 'win32';
        if (!isWindows) {
            return 'claude';
        }
        const candidates = [
            'claude.cmd',
            (0, path_1.join)(process.env.APPDATA || '', 'npm', 'claude.cmd'),
            (0, path_1.join)(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', 'claude.cmd'),
            (0, path_1.join)(process.env.LOCALAPPDATA || '', 'npm', 'claude.cmd'),
        ];
        for (const candidate of candidates) {
            if ((0, fs_1.existsSync)(candidate)) {
                console.log('[ClaudeProvider] Found claude at:', candidate);
                return candidate;
            }
        }
        console.log('[ClaudeProvider] Using shell fallback for claude.cmd');
        return 'claude.cmd';
    }
    /**
     * Constrói o comando para iniciar o Claude Code baseado na plataforma e configuração.
     */
    getClaudeCommand(config) {
        const isWindows = process.platform === 'win32';
        const baseArgs = [
            '--model', config.model,
            '--effort', config.effort,
            '--output-format=stream-json',
            '--input-format=stream-json',
            '--dangerously-skip-permissions',
            '--verbose',
        ];
        if (config.webSearch)
            baseArgs.push('--web-search');
        if (isWindows) {
            const claudePath = this.findClaudeExecutable();
            const useShell = claudePath === 'claude.cmd';
            return {
                command: claudePath,
                args: baseArgs,
                options: {
                    cwd: config.projectPath,
                    env: { ...process.env, CLAUDE_CODE_IDE: 'infiny' },
                    shell: useShell,
                    windowsHide: true,
                },
            };
        }
        return {
            command: 'claude',
            args: baseArgs,
            options: {
                cwd: config.projectPath,
                env: { ...process.env, CLAUDE_CODE_IDE: 'infiny' },
            },
        };
    }
    /**
     * Parseia uma linha do stream JSON do Claude Code.
     * Retorna objeto padronizado ou null se não for relevante.
     */
    parseStreamJson(line) {
        try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'assistant' && parsed.message?.content) {
                const textContent = parsed.message.content
                    .filter((c) => c.type === 'text')
                    .map((c) => c.text)
                    .join('');
                if (textContent) {
                    return { type: 'assistant', text: textContent };
                }
            }
            if (parsed.type === 'result' && parsed.result) {
                return { type: 'result', text: parsed.result };
            }
            if (parsed.type === 'system' && parsed.subtype === 'init') {
                return { type: 'system', text: `Sessão iniciada (${parsed.model})` };
            }
            if (parsed.type === 'system' && parsed.subtype === 'thinking_tokens') {
                return { type: 'thinking', text: '' };
            }
            return null;
        }
        catch {
            return null;
        }
    }
}
exports.ClaudeProvider = ClaudeProvider;
//# sourceMappingURL=ClaudeProvider.js.map