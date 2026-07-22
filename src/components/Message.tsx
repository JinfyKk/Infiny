import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, ExternalLink } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Sparkles, User } from 'lucide-react'
import { useToastHelpers } from '@/components/ui/Toast'

interface MessageProps {
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    images?: string[]
    timestamp: number
    isStreaming?: boolean
  }
  isStreaming?: boolean
}

const renderers = {
  code({ node }: any) {
    const language = node.language || 'plaintext'
    const code = String(node.value || node.children?.[0]?.value || '')

    return (
      <div className="code-block my-3 overflow-hidden rounded-xl border border-border bg-surface/80">
        <div className="code-block-header flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border">
          <span className="text-xs font-medium text-textMuted uppercase tracking-wider">{language}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              'text-textMuted hover:bg-surfaceHover hover:text-textPrimary'
            )}
            aria-label="Copiar código"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar</span>
          </button>
        </div>
        <pre className="p-4 overflow-x-auto"><code className={`language-${language} text-sm font-mono`}>{code}</code></pre>
      </div>
    )
  },
  pre() {
    return null
  },
  img({ node }: any) {
    const src = node.url
    const alt = node.alt || 'Imagem'
    return (
      <div className="my-3 rounded-lg overflow-hidden border border-border max-w-full">
        <img
          src={src}
          alt={alt}
          className="w-full max-w-[600px] max-h-[400px] object-contain"
          loading="lazy"
        />
      </div>
    )
  },
  a({ node, children, ...props }: any) {
    const href = node.url
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1"
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  },
  blockquote({ children, ...props }: any) {
    return (
      <blockquote {...props} className="border-l-4 border-primary/50 pl-4 italic text-textSecondary my-3">
        {children}
      </blockquote>
    )
  },
  hr() {
    return <hr className="my-4 border-border" />
  },
}

export function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn(
      'flex gap-3 animate-in slide-up-200',
      isUser && 'flex-row-reverse',
      isAssistant && 'flex-row'
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={cn(
        'max-w-[85%] flex flex-col gap-2',
        isUser ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          'px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-primary/15 text-text rounded-br-md'
            : 'bg-surfaceHover text-text rounded-bl-md'
        )}>
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={img} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <ReactMarkdown
            components={renderers}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
          >
            {message.content}
          </ReactMarkdown>

          {isStreaming && (
            <span className="inline-block w-1.5 h-5 bg-current animate-pulse ml-0.5 align-bottom" aria-hidden="true" />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-textMuted px-1">
          <span>{formatDate(message.timestamp)}</span>
          {isAssistant && message.content.length > 100 && (
            <CopyButton content={message.content} />
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-textSecondary" />
        </div>
      )}
    </div>
  )
}

function CopyButton({ content }: { content: string }) {
  const { success } = useToastHelpers()

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    success('Copiado', 'Código copiado para a área de transferência')
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors'
      )}
      aria-label="Copiar resposta"
    >
      <Copy className="w-3.5 h-3.5" />
      <span className="text-xs">Copiar</span>
    </button>
  )
}