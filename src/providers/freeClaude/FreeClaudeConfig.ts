import { ProviderConfig } from '../Provider'

/**
 * Configuração simplificada do FreeClaudeProvider.
 *
 * ARQUITETURA NOVA (integração nativa):
 * - O Infiny NÃO configura mais: freeProvider, apiKey, modelMapping, fccServerArgs
 * - Toda configuração do fcc-server é feita via ~/.config/fcc/.env
 *   (lido automaticamente pelo Settings do free-claude-code via env_file)
 * - O provider apenas orquestra: spawn fcc-server → health check → spawn fcc-claude
 * - Modelos usam nomes Anthropic puros: claude-fable-5, claude-opus-4-8, etc.
 *   Resolução para modelo real (nvidia_nim/..., openrouter/...) feita pelo fcc-server.
 */
export type FreeClaudeProviderId = string // Não mais usado - mantido para compatibilidade se necessário

export interface FreeClaudeConfig extends ProviderConfig {
  /**
   * @deprecated Não mais usado. Configuração do fcc-server é via ~/.config/fcc/.env
   */
  freeProvider?: FreeClaudeProviderId

  /**
   * @deprecated Não mais usado. API Key é configurada no ~/.config/fcc/.env
   */
  apiKey?: string

  /**
   * @deprecated Não mais usado. Mapeamento de modelos é feito pelo fcc-server
   * via MODEL_FABLE, MODEL_OPUS, MODEL_SONNET, MODEL_HAIKU no .env
   */
  modelMapping?: Record<string, string>

  /**
   * @deprecated Não mais usado. fcc-server não aceita argumentos CLI para configuração
   */
  fccServerArgs?: string[]

  /**
   * Porta do fcc-server (padrão: 8082).
   * Apenas para health check - o fcc-server usa a porta do seu .env (padrão 8082).
   */
  proxyPort?: number

  /**
   * Host do fcc-server (padrão: '127.0.0.1').
   */
  proxyHost?: string

  /**
   * Timeout para health check do fcc-server (ms). Padrão: 30000
   */
  healthCheckTimeout?: number

  /**
   * @deprecated Não mais usado. Instalação é responsabilidade do usuário via uv/pipx.
   */
  autoInstall?: boolean
}

/**
 * Configuração padrão simplificada.
 */
export const DEFAULT_FREE_CLAUDE_CONFIG: Partial<FreeClaudeConfig> = {
  proxyHost: '127.0.0.1',
  proxyPort: 8082,
  healthCheckTimeout: 30_000,
  autoInstall: false,
  fccServerArgs: [],
  modelMapping: {},
  freeProvider: undefined,
  apiKey: undefined,
}

/**
 * Opção de modelo para o ModelSelector.
 */
export interface ModelOption {
  value: string
  label: string
  description: string
}

/**
 * Modelos Anthropic conhecidos para UI (seleção no ModelSelector).
 * Estes são NOMES PUROS ANTHROPIC - NÃO IDs de provedor interno.
 * O fcc-claude recebe --model claude-fable-5 e o fcc-server resolve
 * internamente via MODEL_FABLE, MODEL_OPUS, etc. configurados no .env.
 */
export const ANTHROPIC_MODEL_ALIASES: Record<string, string[]> = {
  'claude-fable-5': ['fable-5', 'fable'],
  'claude-opus-4-8': ['opus-4-8', 'opus'],
  'claude-sonnet-5': ['sonnet-5', 'sonnet'],
  'claude-haiku-4-5-20251001': ['haiku-4-5', 'haiku'],
  'claude-haiku-4-5': ['haiku'],
}

/**
 * Modelos suportados pela UI (nomes Anthropic puros).
 */
export const SUPPORTED_ANTHROPIC_MODELS: string[] = [
  'claude-fable-5',
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5',
]

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
export function getModelDescription(model: string): string {
  const descriptions: Record<string, string> = {
    'claude-fable-5': 'Mais avançado — raciocínio complexo',
    'claude-opus-4-8': 'Alta complexidade — análise profunda',
    'claude-sonnet-5': 'Equilibrado — uso geral',
    'claude-haiku-4-5-20251001': 'Rápido e eficiente',
    'claude-haiku-4-5': 'Rápido e eficiente',
  }
  return descriptions[model] ?? 'Modelo personalizado'
}

/**
 * Obtém todas as opções de modelo formatadas para o ModelSelector.
 * Não depende mais de provedor - retorna todos os modelos Anthropic suportados.
 */
export function getModelOptionsForProvider(_provider?: string): ModelOption[] {
  return SUPPORTED_ANTHROPIC_MODELS.map((model) => ({
    value: model,
    label: getModelLabel(model),
    description: getModelDescription(model),
  }))
}