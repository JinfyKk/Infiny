/**
 * Free Claude Code Provider - Export Barrel
 *
 * Provider que usa free-claude-code (fcc-server proxy) para acessar
 * modelos via provedores gratuitos (OpenRouter, Groq, Ollama, etc.)
 * mantendo a interface idêntica ao ClaudeProvider oficial.
 */

export { FreeClaudeProvider, createFreeClaudeProvider } from './FreeClaudeProvider'
export { FCCServerManager } from './fccServerManager'

// Tipos (export type para isolatedModules)
export type {
  FreeClaudeConfig,
  FreeClaudeProviderId,
} from './FreeClaudeConfig'

// Valores (funções, constantes)
export {
  DEFAULT_FREE_CLAUDE_CONFIG,
  ANTHROPIC_MODEL_ALIASES,
  DEFAULT_MODEL_MAPPING_OPENROUTER,
  DEFAULT_MODEL_MAPPING_GROQ,
  getDefaultModelMapping,
} from './FreeClaudeConfig'

// Re-exports de modelMapping
export {
  getSupportedModelsForProvider as getFreeClaudeSupportedModels,
  getModelLabel as getFreeClaudeModelLabel,
  getModelDescription as getFreeClaudeModelDescription,
  resolveModelId as resolveFreeClaudeModelId,
  isModelSupported,
  getModelOptionsForProvider,
} from './modelMapping'