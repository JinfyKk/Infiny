import { ProviderConfig } from '../Provider'

/**
 * Provedores gratuitos suportados pelo free-claude-code (fcc-server).
 * Cada um mapeia para um provedor real (OpenRouter, Groq, etc.)
 */
export type FreeClaudeProviderId =
  | 'openrouter'
  | 'groq'
  | 'ollama'
  | 'gemini'
  | 'deepseek'
  | 'cohere'
  | 'cerebras'
  | 'together'
  | 'xai'
  | 'mistral'
  | 'nvidia'
  | 'bedrock'
  | 'vertex'
  | 'cloudflare'
  | 'custom'

/**
 * Configuração específica do FreeClaudeProvider.
 * Estende ProviderConfig com opções do fcc-server.
 */
export interface FreeClaudeConfig extends ProviderConfig {
  /**
   * Provedor gratuito a usar (ex: 'openrouter', 'groq', 'ollama').
   * Se não informado, usa o configurado no fcc-server.
   */
  freeProvider?: FreeClaudeProviderId

  /**
   * API Key do provedor escolhido.
   * Opcional se já configurada no fcc-server ou variáveis de ambiente.
   */
  apiKey?: string

  /**
   * Porta para o fcc-server (proxy local).
   * Se não informado, escolhe porta livre automaticamente (8080-8090).
   */
  proxyPort?: number

  /**
   * Host do fcc-server.
   * Padrão: '127.0.0.1'
   */
  proxyHost?: string

  /**
   * Mapeamento customizado de modelos Anthropic → IDs do provedor.
   * Ex: { 'sonnet': 'openrouter/anthropic/claude-3.5-sonnet' }
   * Se não informado, usa mapeamento padrão do fcc-server.
   */
  modelMapping?: Record<string, string>

  /**
   * Caminho do executável fcc-server.
   * Se não informado, tenta 'fcc-server' no PATH.
   */
  fccServerPath?: string

  /**
   * Argumentos extras para o fcc-server.
   */
  fccServerArgs?: string[]

  /**
   * Timeout para health check do fcc-server (ms).
   * Padrão: 10000
   */
  healthCheckTimeout?: number

  /**
   * Se deve auto-instalar fcc-server via pipx/uv se não encontrado.
   * Padrão: false (apenas avisa)
   */
  autoInstall?: boolean
}

/**
 * Configuração padrão para FreeClaudeProvider.
 */
export const DEFAULT_FREE_CLAUDE_CONFIG: Partial<FreeClaudeConfig> = {
  proxyHost: '127.0.0.1',
  proxyPort: undefined, // porta livre automática
  healthCheckTimeout: 10000,
  autoInstall: false,
  fccServerArgs: [],
  modelMapping: {},
}

/**
 * Modelos Anthropic conhecidos e seus aliases para mapeamento.
 */
export const ANTHROPIC_MODEL_ALIASES: Record<string, string[]> = {
  'claude-fable-5': ['fable-5', 'fable'],
  'claude-opus-4-8': ['opus-4-8', 'opus'],
  'claude-sonnet-5': ['sonnet-5', 'sonnet'],
  'claude-haiku-4-5-20251001': ['haiku-4-5', 'haiku'],
  'claude-haiku-4-5': ['haiku'],
}

/**
 * Mapeamento padrão de modelos Anthropic → Provedores gratuitos (OpenRouter).
 * Usado quando não há modelMapping customizado.
 */
export const DEFAULT_MODEL_MAPPING_OPENROUTER: Record<string, string> = {
  'claude-fable-5': 'openrouter/anthropic/claude-3.5-sonnet', // Fable 5 ≈ Sonnet 3.5
  'claude-opus-4-8': 'openrouter/anthropic/claude-3-opus',
  'claude-sonnet-5': 'openrouter/anthropic/claude-3.5-sonnet',
  'claude-haiku-4-5-20251001': 'openrouter/anthropic/claude-3.5-haiku',
  'claude-haiku-4-5': 'openrouter/anthropic/claude-3.5-haiku',
}

/**
 * Mapeamento para Groq (modelos rápidos gratuitos).
 */
export const DEFAULT_MODEL_MAPPING_GROQ: Record<string, string> = {
  'claude-fable-5': 'groq/llama-3.3-70b-versatile',
  'claude-opus-4-8': 'groq/llama-3.3-70b-versatile',
  'claude-sonnet-5': 'groq/llama-3.1-70b-versatile',
  'claude-haiku-4-5-20251001': 'groq/llama-3.1-8b-instant',
  'claude-haiku-4-5': 'groq/llama-3.1-8b-instant',
}

/**
 * Retorna mapeamento padrão baseado no provedor gratuito escolhido.
 */
export function getDefaultModelMapping(provider: FreeClaudeProviderId): Record<string, string> {
  switch (provider) {
    case 'groq':
      return DEFAULT_MODEL_MAPPING_GROQ
    case 'openrouter':
    default:
      return DEFAULT_MODEL_MAPPING_OPENROUTER
  }
}