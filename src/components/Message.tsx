import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  chatMessageVariants,
  chatMessageStreamingVariants,
  transitions,
} from '@/lib/transitions'

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
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={transitions.smooth}
        className="my-3 rounded-lg overflow-hidden border border-border max-w-full"
      >
        <img
          src={src}
          alt={alt}
          className="w-full max-w-[600px] max-h-[400px] object-contain"
          loading="lazy"
        />
      </motion.div>
    )
  },
  a({ node, children, ...props }: any) {
    const href = node.url
    return (
      <motion.a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1"
        whileHover={{ x: 2, transition: transitions.snappy }}
        whileTap={{ scale: 0.98, transition: transitions.tweenFast }}
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </motion.a>
    )
  },
  blockquote({ children, ...props }: any) {
    return (
      <motion.blockquote
        {...props}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={transitions.smooth}
        className="border-l-4 border-primary/50 pl-4 italic text-textSecondary my-3"
      >
        {children}
      </motion.blockquote>
    )
  },
  hr() {
    return <motion.hr initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={transitions.smooth} className="my-4 border-border" />
  },
}

export function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const streaming = isStreaming || message.isStreaming

  return (
    <motion.div
      variants={streaming ? chatMessageStreamingVariants : chatMessageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse',
        isAssistant && 'flex-row'
      )}
    >
      {!isUser && (
        <motion.div
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={transitions.bouncy}
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>
      )}

      <div className={cn(
        'max-w-[85%] flex flex-col gap-2',
        isUser ? 'items-end' : 'items-start'
      )}>
        <motion.div
          className={cn(
            'px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-primary/15 text-text rounded-br-md'
              : 'bg-surfaceHover text-text rounded-bl-md'
          )}
          initial={streaming ? undefined : { opacity: 0, y: 10 }}
          animate={streaming ? undefined : { opacity: 1, y: 0 }}
          transition={transitions.smooth}
        >
          {message.images && message.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.smooth}
              className="flex flex-wrap gap-2 mb-2"
            >
              {message.images.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ ...transitions.bouncy, delay: idx * 0.05 }}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
                >
                  <img src={img} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </motion.div>
          )}

          <ReactMarkdown
            components={renderers}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.content}
          </ReactMarkdown>
        </motion.div>
      </div>
    </motion.div>
  )
}