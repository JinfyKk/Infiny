import { FreeClaudeProviderId, ANTHROPIC_MODEL_ALIASES } from './FreeClaudeConfig'

/**
 * Opção de modelo para o ModelSelector.
 */
export interface ModelOption {
  value: string
  label: string
  description: string
}

/**
 * Mapeamento padrão de modelos Anthropic → IDs do provedor OpenRouter.
 * OpenRouter usa formato: provedor/modelo (ex: anthropic/claude-3.5-sonnet)
 */
export const DEFAULT_MODEL_MAPPING_OPENROUTER: Record<string, string> = {
  'claude-fable-5': 'openrouter/anthropic/claude-3.5-sonnet',
  'claude-opus-4-8': 'openrouter/anthropic/claude-3-opus',
  'claude-sonnet-5': 'openrouter/anthropic/claude-3.5-sonnet',
  'claude-haiku-4-5-20251001': 'openrouter/anthropic/claude-3.5-haiku',
  'claude-haiku-4-5': 'openrouter/anthropic/claude-3.5-haiku',
}

/**
 * Mapeamento para Groq (modelos Llama/Mixtral rápidos e gratuitos).
 */
export const DEFAULT_MODEL_MAPPING_GROQ: Record<string, string> = {
  'claude-fable-5': 'groq/llama-3.3-70b-versatile',
  'claude-opus-4-8': 'groq/llama-3.3-70b-versatile',
  'claude-sonnet-5': 'groq/llama-3.1-70b-versatile',
  'claude-haiku-4-5-20251001': 'groq/llama-3.1-8b-instant',
  'claude-haiku-4-5': 'groq/llama-3.1-8b-instant',
}

/**
 * Mapeamento para Ollama (modelos locais).
 * Requer Ollama rodando localmente com modelos baixados.
 */
export const DEFAULT_MODEL_MAPPING_OLLAMA: Record<string, string> = {
  'claude-fable-5': 'ollama/llama3.3:70b',
  'claude-opus-4-8': 'ollama/llama3.3:70b',
  'claude-sonnet-5': 'ollama/llama3.1:70b',
  'claude-haiku-4-5-20251001': 'ollama/llama3.2:3b',
  'claude-haiku-4-5': 'ollama/llama3.2:3b',
}

/**
 * Mapeamento para DeepSeek.
 */
export const DEFAULT_MODEL_MAPPING_DEEPSEEK: Record<string, string> = {
  'claude-fable-5': 'deepseek/deepseek-chat',
  'claude-opus-4-8': 'deepseek/deepseek-chat',
  'claude-sonnet-5': 'deepseek/deepseek-chat',
  'claude-haiku-4-5-20251001': 'deepseek/deepseek-chat',
  'claude-haiku-4-5': 'deepseek/deepseek-chat',
}

/**
 * Retorna mapeamento padrão baseado no provedor gratuito.
 */
export function getDefaultModelMapping(provider: FreeClaudeProviderId): Record<string, string> {
  switch (provider) {
    case 'groq':
      return DEFAULT_MODEL_MAPPING_GROQ
    case 'ollama':
      return DEFAULT_MODEL_MAPPING_OLLAMA
    case 'deepseek':
      return DEFAULT_MODEL_MAPPING_DEEPSEEK
    case 'openrouter':
    default:
      return DEFAULT_MODEL_MAPPING_OPENROUTER
  }
}

/**
 * Retorna lista de modelos suportados para o provedor (chaves do mapeamento).
 */
export function getSupportedModelsForProvider(provider: FreeClaudeProviderId): string[] {
  const mapping = getDefaultModelMapping(provider)
  return Object.keys(mapping)
}

/**
 * Label amigável para exibição no ModelSelector.
 */
export function getModelLabel(model: string): string {
  const labels: Record<string, string> = {
    'claude-fable-5': 'Claude Fable 5 (Free)',
    'claude-opus-4-8': 'Claude Opus 4.8 (Free)',
    'claude-sonnet-5': 'Claude Sonnet 5 (Free)',
    'claude-haiku-4-5-20251001': 'Claude Haiku 4.5 (Free)',
    'claude-haiku-4-5': 'Claude Haiku 4.5 (Free)',
  }
  return labels[model] ?? model
}

/**
 * Descrição do modelo para tooltip.
 */
export function getModelDescription(model: string, provider?: FreeClaudeProviderId): string {
  const baseDescriptions: Record<string, string> = {
    'claude-fable-5': 'Mais avançado - raciocínio complexo',
    'claude-opus-4-8': 'Alta complexidade - análise profunda',
    'claude-sonnet-5': 'Equilibrado - uso geral',
    'claude-haiku-4-5-20251001': 'Rápido e eficiente',
    'claude-haiku-4-5': 'Rápido e eficiente',
  }

  const providerNames: Record<FreeClaudeProviderId, string> = {
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
  }

  const base = baseDescriptions[model] ?? 'Modelo personalizado'
  const via = provider ? ` (${providerNames[provider]})` : ''
  return base + via
}

/**
 * Resolve ID do modelo do provedor a partir do modelo Anthropic solicitado.
 */
export function resolveModelId(
  anthropicModel: string,
  freeProvider: FreeClaudeProviderId,
  customMapping?: Record<string, string>
): string {
  // 1. Mapeamento customizado tem prioridade
  if (customMapping && customMapping[anthropicModel]) {
    return customMapping[anthropicModel]
  }

  // 2. Mapeamento padrão do provedor
  const defaultMapping = getDefaultModelMapping(freeProvider)
  if (defaultMapping[anthropicModel]) {
    return defaultMapping[anthropicModel]
  }

  // 3. Tentar resolver por alias conhecidos
  for (const [canonical, aliases] of Object.entries(ANTHROPIC_MODEL_ALIASES)) {
    if (canonical === anthropicModel || aliases.includes(anthropicModel)) {
      if (defaultMapping[canonical]) {
        return defaultMapping[canonical]
      }
    }
  }

  // 4. Fallback: retorna modelo original (provedor pode aceitar nomes Anthropic)
  console.warn(
    `[FreeClaudeModelMapping] Modelo "${anthropicModel}" não mapeado para provedor "${freeProvider}". ` +
    `Usando nome original. Configure modelMapping se necessário.`
  )
  return anthropicModel
}

/**
 * Verifica se um modelo é suportado pelo provedor.
 */
export function isModelSupported(model: string, freeProvider: FreeClaudeProviderId): boolean {
  const supported = getSupportedModelsForProvider(freeProvider)
  return supported.includes(model)
}

/**
 * Obtém todas as opções de modelo formatadas para o ModelSelector.
 */
export function getModelOptionsForProvider(provider: FreeClaudeProviderId): ModelOption[] {
  const models = getSupportedModelsForProvider(provider)
  return models.map((model) => ({
    value: model,
    label: getModelLabel(model),
    description: getModelDescription(model, provider),
  }))
}