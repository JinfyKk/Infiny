/**
 * Free Claude Code Provider - Export Barrel
 *
 * Provider que usa free-claude-code (fcc-server proxy) para acessar
 * modelos via provedores gratuitos mantendo a interface compatível
 * com Claude Code CLI.
 *
 * ARQUITETURA NOVA (integração nativa):
 * - Orquestra: fcc-server → fcc-claude
 * - NÃO configura provider, API keys, modelos internos, gateway
 * - Toda configuração do fcc-server via ~/.config/fcc/.env
 * - Modelos usam nomes Anthropic puros (claude-fable-5, etc.)
 */

export { FreeClaudeProvider, createFreeClaudeProvider } from './FreeClaudeProvider'
export { FCCServerManager } from './FCCServerManager'

// Tipos
export type {
  FreeClaudeConfig,
  FreeClaudeProviderId,
  ModelOption,
} from './FreeClaudeConfig'

// Valores (funções, constantes) de FreeClaudeConfig
export {
  DEFAULT_FREE_CLAUDE_CONFIG,
  ANTHROPIC_MODEL_ALIASES,
  SUPPORTED_ANTHROPIC_MODELS,
  getModelLabel,
  getModelDescription,
  getModelOptionsForProvider,
} from './FreeClaudeConfig'