"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODEL_MAPPING_DEEPSEEK = exports.DEFAULT_MODEL_MAPPING_OLLAMA = exports.DEFAULT_MODEL_MAPPING_GROQ = exports.DEFAULT_MODEL_MAPPING_OPENROUTER = void 0;
exports.getDefaultModelMapping = getDefaultModelMapping;
exports.getSupportedModelsForProvider = getSupportedModelsForProvider;
exports.getModelLabel = getModelLabel;
exports.getModelDescription = getModelDescription;
exports.resolveModelId = resolveModelId;
exports.isModelSupported = isModelSupported;
exports.getModelOptionsForProvider = getModelOptionsForProvider;
const FreeClaudeConfig_1 = require("./FreeClaudeConfig");
/**
 * Mapeamento padrão de modelos Anthropic → IDs do provedor OpenRouter.
 * OpenRouter usa formato: provedor/modelo (ex: anthropic/claude-3.5-sonnet)
 */
exports.DEFAULT_MODEL_MAPPING_OPENROUTER = {
    'claude-fable-5': 'openrouter/anthropic/claude-3.5-sonnet',
    'claude-opus-4-8': 'openrouter/anthropic/claude-3-opus',
    'claude-sonnet-5': 'openrouter/anthropic/claude-3.5-sonnet',
    'claude-haiku-4-5-20251001': 'openrouter/anthropic/claude-3.5-haiku',
    'claude-haiku-4-5': 'openrouter/anthropic/claude-3.5-haiku',
};
/**
 * Mapeamento para Groq (modelos Llama/Mixtral rápidos e gratuitos).
 */
exports.DEFAULT_MODEL_MAPPING_GROQ = {
    'claude-fable-5': 'groq/llama-3.3-70b-versatile',
    'claude-opus-4-8': 'groq/llama-3.3-70b-versatile',
    'claude-sonnet-5': 'groq/llama-3.1-70b-versatile',
    'claude-haiku-4-5-20251001': 'groq/llama-3.1-8b-instant',
    'claude-haiku-4-5': 'groq/llama-3.1-8b-instant',
};
/**
 * Mapeamento para Ollama (modelos locais).
 * Requer Ollama rodando localmente com modelos baixados.
 */
exports.DEFAULT_MODEL_MAPPING_OLLAMA = {
    'claude-fable-5': 'ollama/llama3.3:70b',
    'claude-opus-4-8': 'ollama/llama3.3:70b',
    'claude-sonnet-5': 'ollama/llama3.1:70b',
    'claude-haiku-4-5-20251001': 'ollama/llama3.2:3b',
    'claude-haiku-4-5': 'ollama/llama3.2:3b',
};
/**
 * Mapeamento para DeepSeek.
 */
exports.DEFAULT_MODEL_MAPPING_DEEPSEEK = {
    'claude-fable-5': 'deepseek/deepseek-chat',
    'claude-opus-4-8': 'deepseek/deepseek-chat',
    'claude-sonnet-5': 'deepseek/deepseek-chat',
    'claude-haiku-4-5-20251001': 'deepseek/deepseek-chat',
    'claude-haiku-4-5': 'deepseek/deepseek-chat',
};
/**
 * Retorna mapeamento padrão baseado no provedor gratuito.
 */
function getDefaultModelMapping(provider) {
    switch (provider) {
        case 'groq':
            return exports.DEFAULT_MODEL_MAPPING_GROQ;
        case 'ollama':
            return exports.DEFAULT_MODEL_MAPPING_OLLAMA;
        case 'deepseek':
            return exports.DEFAULT_MODEL_MAPPING_DEEPSEEK;
        case 'openrouter':
        default:
            return exports.DEFAULT_MODEL_MAPPING_OPENROUTER;
    }
}
/**
 * Retorna lista de modelos suportados para o provedor (chaves do mapeamento).
 */
function getSupportedModelsForProvider(provider) {
    const mapping = getDefaultModelMapping(provider);
    return Object.keys(mapping);
}
/**
 * Label amigável para exibição no ModelSelector.
 */
function getModelLabel(model) {
    const labels = {
        'claude-fable-5': 'Claude Fable 5 (Free)',
        'claude-opus-4-8': 'Claude Opus 4.8 (Free)',
        'claude-sonnet-5': 'Claude Sonnet 5 (Free)',
        'claude-haiku-4-5-20251001': 'Claude Haiku 4.5 (Free)',
        'claude-haiku-4-5': 'Claude Haiku 4.5 (Free)',
    };
    return labels[model] ?? model;
}
/**
 * Descrição do modelo para tooltip.
 */
function getModelDescription(model, provider) {
    const baseDescriptions = {
        'claude-fable-5': 'Mais avançado - raciocínio complexo',
        'claude-opus-4-8': 'Alta complexidade - análise profunda',
        'claude-sonnet-5': 'Equilibrado - uso geral',
        'claude-haiku-4-5-20251001': 'Rápido e eficiente',
        'claude-haiku-4-5': 'Rápido e eficiente',
    };
    const providerNames = {
        openrouter: 'via OpenRouter',
        groq: 'via Groq (rápido)',
        ollama: 'via Ollama (local)',
        gemini: 'via Google Gemini',
        deepseek: 'via DeepSeek',
        cohere: 'via Cohere',
        cerebras: 'via Cerebras',
        together: 'via Together AI',
        xai: 'via xAI Grok',
        mistral: 'via Mistral',
        nvidia: 'via NVIDIA NIM',
        bedrock: 'via AWS Bedrock',
        vertex: 'via Vertex AI',
        cloudflare: 'via Cloudflare Workers AI',
        custom: 'personalizado',
    };
    const base = baseDescriptions[model] ?? 'Modelo personalizado';
    const via = provider ? ` (${providerNames[provider]})` : '';
    return base + via;
}
/**
 * Resolve ID do modelo do provedor a partir do modelo Anthropic solicitado.
 */
function resolveModelId(anthropicModel, freeProvider, customMapping) {
    // 1. Mapeamento customizado tem prioridade
    if (customMapping && customMapping[anthropicModel]) {
        return customMapping[anthropicModel];
    }
    // 2. Mapeamento padrão do provedor
    const defaultMapping = getDefaultModelMapping(freeProvider);
    if (defaultMapping[anthropicModel]) {
        return defaultMapping[anthropicModel];
    }
    // 3. Tentar resolver por alias conhecidos
    for (const [canonical, aliases] of Object.entries(FreeClaudeConfig_1.ANTHROPIC_MODEL_ALIASES)) {
        if (canonical === anthropicModel || aliases.includes(anthropicModel)) {
            if (defaultMapping[canonical]) {
                return defaultMapping[canonical];
            }
        }
    }
    // 4. Fallback: retorna modelo original (provedor pode aceitar nomes Anthropic)
    console.warn(`[FreeClaudeModelMapping] Modelo "${anthropicModel}" não mapeado para provedor "${freeProvider}". ` +
        `Usando nome original. Configure modelMapping se necessário.`);
    return anthropicModel;
}
/**
 * Verifica se um modelo é suportado pelo provedor.
 */
function isModelSupported(model, freeProvider) {
    const supported = getSupportedModelsForProvider(freeProvider);
    return supported.includes(model);
}
/**
 * Obtém todas as opções de modelo formatadas para o ModelSelector.
 */
function getModelOptionsForProvider(provider) {
    const models = getSupportedModelsForProvider(provider);
    return models.map((model) => ({
        value: model,
        label: getModelLabel(model),
        description: getModelDescription(model, provider),
    }));
}
//# sourceMappingURL=modelMapping.js.map