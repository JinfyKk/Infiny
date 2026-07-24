import { ProviderConfig } from '../Provider';
/**
 * Provedores gratuitos suportados pelo free-claude-code (fcc-server).
 * Cada um mapeia para um provedor real (OpenRouter, Groq, etc.)
 */
export type FreeClaudeProviderId = 'openrouter' | 'groq' | 'ollama' | 'gemini' | 'deepseek' | 'cohere' | 'cerebras' | 'together' | 'xai' | 'mistral' | 'nvidia' | 'bedrock' | 'vertex' | 'cloudflare' | 'custom';
/**
 * Configuração específica do FreeClaudeProvider.
 * Estende ProviderConfig com opções do fcc-server.
 */
export interface FreeClaudeConfig extends ProviderConfig {
    /**
     * Provedor gratuito a usar (ex: 'openrouter', 'groq', 'ollama').
     * Se não informado, usa o configurado no fcc-server.
     */
    freeProvider?: FreeClaudeProviderId;
    /**
     * API Key do provedor escolhido.
     * Opcional se já configurada no fcc-server ou variáveis de ambiente.
     */
    apiKey?: string;
    /**
     * Porta para o fcc-server (proxy local).
     * Se não informado, escolhe porta livre automaticamente (8080-8090).
     */
    proxyPort?: number;
    /**
     * Host do fcc-server.
     * Padrão: '127.0.0.1'
     */
    proxyHost?: string;
    /**
     * Mapeamento customizado de modelos Anthropic → IDs do provedor.
     * Ex: { 'sonnet': 'openrouter/anthropic/claude-3.5-sonnet' }
     * Se não informado, usa mapeamento padrão do fcc-server.
     */
    modelMapping?: Record<string, string>;
    /**
     * Caminho do executável fcc-server.
     * Se não informado, tenta 'fcc-server' no PATH.
     */
    fccServerPath?: string;
    /**
     * Argumentos extras para o fcc-server.
     */
    fccServerArgs?: string[];
    /**
     * Timeout para health check do fcc-server (ms).
     * Padrão: 10000
     */
    healthCheckTimeout?: number;
    /**
     * Se deve auto-instalar fcc-server via pipx/uv se não encontrado.
     * Padrão: false (apenas avisa)
     */
    autoInstall?: boolean;
}
/**
 * Configuração padrão para FreeClaudeProvider.
 */
export declare const DEFAULT_FREE_CLAUDE_CONFIG: Partial<FreeClaudeConfig>;
/**
 * Modelos Anthropic conhecidos e seus aliases para mapeamento.
 */
export declare const ANTHROPIC_MODEL_ALIASES: Record<string, string[]>;
/**
 * Mapeamento padrão de modelos Anthropic → Provedores gratuitos (OpenRouter).
 * Usado quando não há modelMapping customizado.
 */
export declare const DEFAULT_MODEL_MAPPING_OPENROUTER: Record<string, string>;
/**
 * Mapeamento para Groq (modelos rápidos gratuitos).
 */
export declare const DEFAULT_MODEL_MAPPING_GROQ: Record<string, string>;
/**
 * Retorna mapeamento padrão baseado no provedor gratuito escolhido.
 */
export declare function getDefaultModelMapping(provider: FreeClaudeProviderId): Record<string, string>;
//# sourceMappingURL=FreeClaudeConfig.d.ts.map