import { FreeClaudeProviderId } from './FreeClaudeConfig';
/**
 * Mapeamento padrão de modelos Anthropic → IDs do provedor OpenRouter.
 * OpenRouter usa formato: provedor/modelo (ex: anthropic/claude-3.5-sonnet)
 */
export declare const DEFAULT_MODEL_MAPPING_OPENROUTER: Record<string, string>;
/**
 * Mapeamento para Groq (modelos Llama/Mixtral rápidos e gratuitos).
 */
export declare const DEFAULT_MODEL_MAPPING_GROQ: Record<string, string>;
/**
 * Mapeamento para Ollama (modelos locais).
 * Requer Ollama rodando localmente com modelos baixados.
 */
export declare const DEFAULT_MODEL_MAPPING_OLLAMA: Record<string, string>;
/**
 * Mapeamento para DeepSeek.
 */
export declare const DEFAULT_MODEL_MAPPING_DEEPSEEK: Record<string, string>;
/**
 * Retorna mapeamento padrão baseado no provedor gratuito.
 */
export declare function getDefaultModelMapping(provider: FreeClaudeProviderId): Record<string, string>;
/**
 * Retorna lista de modelos suportados para o provedor (chaves do mapeamento).
 */
export declare function getSupportedModelsForProvider(provider: FreeClaudeProviderId): string[];
/**
 * Label amigável para exibição no ModelSelector.
 */
export declare function getModelLabel(model: string): string;
/**
 * Descrição do modelo para tooltip.
 */
export declare function getModelDescription(model: string, provider?: FreeClaudeProviderId): string;
/**
 * Resolve ID do modelo do provedor a partir do modelo Anthropic solicitado.
 */
export declare function resolveModelId(anthropicModel: string, freeProvider: FreeClaudeProviderId, customMapping?: Record<string, string>): string;
/**
 * Verifica se um modelo é suportado pelo provedor.
 */
export declare function isModelSupported(model: string, freeProvider: FreeClaudeProviderId): boolean;
/**
 * Obtém todas as opções de modelo formatadas para o ModelSelector.
 */
export declare function getModelOptionsForProvider(provider: FreeClaudeProviderId): Array<{
    value: string;
    label: string;
    description: string;
}>;
//# sourceMappingURL=modelMapping.d.ts.map