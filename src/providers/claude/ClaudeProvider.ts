import { AIProvider, ProviderConfig, ProviderManager } from '../Provider'
import { spawn, ChildProcess, SpawnOptions } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

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
export class ClaudeProvider implements AIProvider {
  private process: ChildProcess | null = null
  private config: ProviderConfig | null = null
  private messageBuffer = ''
  private dataCallback: ((data: string) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null
  private exitCallback: ((code: number) => void) | null = null
  private readyCallback: (() => void) | null = null

  constructor(_providerManager: ProviderManager) {}

  getId(): string {
    return 'claude'
  }

  getName(): string {
    return 'Claude Code'
  }

  getSupportedModels(): string[] {
    return [
      'claude-fable-5',
      'claude-opus-4-8',
      'claude-sonnet-5',
      'claude-haiku-4-5-20251001',
      'claude-haiku-4-5',
    ]
  }

  getSupportedEfforts(): string[] {
    return ['low', 'medium', 'high', 'max', 'xhigh']
  }

  supportsWebSearch(): boolean {
    return true
  }

  supportsImages(): boolean {
    return true
  }

  async start(config: ProviderConfig): Promise<void> {
    this.config = config

    if (this.process) {
      this.process.kill()
    }

    this.messageBuffer = ''

    const { command, args, options } = this.getClaudeCommand(config)

    console.log('[ClaudeProvider] Starting:', command, args.join(' '))
    console.log('[ClaudeProvider] Working directory:', config.projectPath)
    console.log('[ClaudeProvider] Platform:', process.platform)

    this.process = spawn(command, args, options)

    this.process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      console.log('[ClaudeProvider] stdout:', output.substring(0, 500))

      this.messageBuffer += output
      const lines = this.messageBuffer.split('\n')
      this.messageBuffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          const parsed = this.parseStreamJson(line.trim())
          if (parsed?.text && this.dataCallback) {
            if (parsed.type === 'assistant' || parsed.type === 'result') {
              this.dataCallback(parsed.text)
            } else if (parsed.type === 'system') {
              this.dataCallback(`\n[${parsed.text}]\n`)
            }
          }
        }
      }
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      const error = data.toString()
      console.error('[ClaudeProvider] stderr:', error)
      if (this.errorCallback) {
        this.errorCallback(error)
      }
    })

    this.process.on('close', (code: number | null) => {
      console.log('[ClaudeProvider] Process exited with code:', code)
      if (this.exitCallback) {
        this.exitCallback(code ?? 0)
      }
      this.process = null
    })

    this.process.on('error', (err: Error) => {
      console.error('[ClaudeProvider] Failed to start process:', err)
      if (this.errorCallback) {
        this.errorCallback(`Erro ao iniciar Claude: ${err.message}`)
      }
      if (this.exitCallback) {
        this.exitCallback(1)
      }
      this.process = null
    })

    // Emit ready when process is confirmed spawned
    this.process.on('spawn', () => {
      console.log('[ClaudeProvider] Process spawned, emitting ready')
      this.readyCallback?.()
    })
  }

  async send(message: string, images?: string[]): Promise<void> {
    if (!this.process || !this.process.stdin?.writable) {
      console.error('[ClaudeProvider] No active process or stdin not writable')
      throw new Error('Processo Claude não está rodando')
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
      : JSON.stringify({ type: 'user', message: { role: 'user', content: message } })

    console.log('[ClaudeProvider] Sending:', payload.substring(0, 200))

    try {
      this.process.stdin.write(payload + '\n')
    } catch (err) {
      console.error('[ClaudeProvider] Failed to write to stdin:', err)
      throw err
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      console.log('[ClaudeProvider] Stopping process')
      this.process.kill('SIGINT')
      this.process = null
    }
  }

  async restart(): Promise<void> {
    if (!this.config) {
      throw new Error('Não há configuração salva para reiniciar')
    }
    await this.stop()
    // Aguardar um pouco para o processo terminar
    await new Promise((resolve) => setTimeout(resolve, 500))
    await this.start(this.config)
  }

  isRunning(): boolean {
    return this.process !== null
  }

  onData(callback: (data: string) => void): () => void {
    this.dataCallback = callback
    return () => {
      this.dataCallback = null
    }
  }

  onError(callback: (error: string) => void): () => void {
    this.errorCallback = callback
    return () => {
      this.errorCallback = null
    }
  }

  onExit(callback: (code: number) => void): () => void {
    this.exitCallback = callback
    return () => {
      this.exitCallback = null
    }
  }

  onReady(callback: () => void): () => void {
    this.readyCallback = callback
    return () => {
      this.readyCallback = null
    }
  }

  /**
   * Encontra o executável do Claude no Windows.
   */
  private findClaudeExecutable(): string {
    const isWindows = process.platform === 'win32'

    if (!isWindows) {
      return 'claude'
    }

    const candidates = [
      'claude.cmd',
      join(process.env.APPDATA || '', 'npm', 'claude.cmd'),
      join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', 'claude.cmd'),
      join(process.env.LOCALAPPDATA || '', 'npm', 'claude.cmd'),
    ]

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        console.log('[ClaudeProvider] Found claude at:', candidate)
        return candidate
      }
    }

    console.log('[ClaudeProvider] Using shell fallback for claude.cmd')
    return 'claude.cmd'
  }

  /**
   * Constrói o comando para iniciar o Claude Code baseado na plataforma e configuração.
   */
  private getClaudeCommand(config: ProviderConfig): { command: string; args: string[]; options: SpawnOptions } {
    const isWindows = process.platform === 'win32'
    const baseArgs = [
      '--model', config.model,
      '--effort', config.effort,
      '--output-format=stream-json',
      '--input-format=stream-json',
      '--dangerously-skip-permissions',
      '--verbose',
    ]

    if (config.webSearch) baseArgs.push('--web-search')

    if (isWindows) {
      const claudePath = this.findClaudeExecutable()
      const useShell = claudePath === 'claude.cmd'

      return {
        command: claudePath,
        args: baseArgs,
        options: {
          cwd: config.projectPath,
          env: { ...process.env, CLAUDE_CODE_IDE: 'infiny' },
          shell: useShell,
          windowsHide: true,
        },
      }
    }

    return {
      command: 'claude',
      args: baseArgs,
      options: {
        cwd: config.projectPath,
        env: { ...process.env, CLAUDE_CODE_IDE: 'infiny' },
      },
    }
  }

  /**
   * Parseia uma linha do stream JSON do Claude Code.
   * Retorna objeto padronizado ou null se não for relevante.
   */
  private parseStreamJson(line: string): { type: string; text?: string; isError?: boolean } | null {
    try {
      const parsed = JSON.parse(line)

      if (parsed.type === 'assistant' && parsed.message?.content) {
        const textContent = parsed.message.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        if (textContent) {
          return { type: 'assistant', text: textContent }
        }
      }

      if (parsed.type === 'result' && parsed.result) {
        return { type: 'result', text: parsed.result }
      }

      if (parsed.type === 'system' && parsed.subtype === 'init') {
        return { type: 'system', text: `Sessão iniciada (${parsed.model})` }
      }

      if (parsed.type === 'system' && parsed.subtype === 'thinking_tokens') {
        return { type: 'thinking', text: '' }
      }

      return null
    } catch {
      return null
    }
  }
}