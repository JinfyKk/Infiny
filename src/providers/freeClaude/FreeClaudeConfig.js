"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODEL_MAPPING_GROQ = exports.DEFAULT_MODEL_MAPPING_OPENROUTER = exports.ANTHROPIC_MODEL_ALIASES = exports.DEFAULT_FREE_CLAUDE_CONFIG = void 0;
exports.getDefaultModelMapping = getDefaultModelMapping;
/**
 * Configuração padrão para FreeClaudeProvider.
 */
exports.DEFAULT_FREE_CLAUDE_CONFIG = {
    proxyHost: '127.0.0.1',
    proxyPort: undefined, // porta livre automática
    healthCheckTimeout: 10000,
    autoInstall: false,
    fccServerArgs: [],
    modelMapping: {},
};
/**
 * Modelos Anthropic conhecidos e seus aliases para mapeamento.
 */
exports.ANTHROPIC_MODEL_ALIASES = {
    'claude-fable-5': ['fable-5', 'fable'],
    'claude-opus-4-8': ['opus-4-8', 'opus'],
    'claude-sonnet-5': ['sonnet-5', 'sonnet'],
    'claude-haiku-4-5-20251001': ['haiku-4-5', 'haiku'],
    'claude-haiku-4-5': ['haiku'],
};
/**
 * Mapeamento padrão de modelos Anthropic → Provedores gratuitos (OpenRouter).
 * Usado quando não há modelMapping customizado.
 */
exports.DEFAULT_MODEL_MAPPING_OPENROUTER = {
    'claude-fable-5': 'openrouter/anthropic/claude-3.5-sonnet', // Fable 5 ≈ Sonnet 3.5
    'claude-opus-4-8': 'openrouter/anthropic/claude-3-opus',
    'claude-sonnet-5': 'openrouter/anthropic/claude-3.5-sonnet',
    'claude-haiku-4-5-20251001': 'openrouter/anthropic/claude-3.5-haiku',
    'claude-haiku-4-5': 'openrouter/anthropic/claude-3.5-haiku',
};
/**
 * Mapeamento para Groq (modelos rápidos gratuitos).
 */
exports.DEFAULT_MODEL_MAPPING_GROQ = {
    'claude-fable-5': 'groq/llama-3.3-70b-versatile',
    'claude-opus-4-8': 'groq/llama-3.3-70b-versatile',
    'claude-sonnet-5': 'groq/llama-3.1-70b-versatile',
    'claude-haiku-4-5-20251001': 'groq/llama-3.1-8b-instant',
    'claude-haiku-4-5': 'groq/llama-3.1-8b-instant',
};
/**
 * Retorna mapeamento padrão baseado no provedor gratuito escolhido.
 */
function getDefaultModelMapping(provider) {
    switch (provider) {
        case 'groq':
            return exports.DEFAULT_MODEL_MAPPING_GROQ;
        case 'openrouter':
        default:
            return exports.DEFAULT_MODEL_MAPPING_OPENROUTER;
    }
}
//# sourceMappingURL=FreeClaudeConfig.js.map