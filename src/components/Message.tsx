import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/store/infinyStore'
import turtlyImg from '@/assets/Gemini_Generated_Image_xev09dxev09dxev0-removebg-preview.png'
import { EXTERNAL_LINK_EVENT } from '@/components/ui/LinkWarningDialog'
import { TURTLY_WAITING_PHRASES } from '@/lib/turtlyWaitingPhrases'
import {
  chatMessageVariants,
  chatMessageStreamingVariants,
  transitions,
} from '@/lib/transitions'

const PROVIDER_LABELS: Record<string, string> = {
  'free-claude': 'Claude',
  claude: 'Claude',
  openai: 'ChatGPT',
  gemini: 'Gemini',
  local: 'Ollama',
}

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
  a({ node, children, href, ...props }: any) {
    const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href)

    const handleClick = (e: any) => {
      if (isExternal) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent(EXTERNAL_LINK_EVENT, { detail: { url: href } }))
      }
    }

    return (
      <motion.a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
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

function TypingIndicator() {
  const provider = useStore((state) => state.settings.provider)
  const providerLabel = PROVIDER_LABELS[provider] || 'provedor'

const allMessages = useMemo(
  () => [
    ...TURTLY_WAITING_PHRASES,
    `🐢 perguntando pro ${providerLabel}...`,
  ],
  [providerLabel]
)
  // Embaralha as frases e escolhe quantas vão aparecer dessa vez —
  // não precisa mostrar todas, e a ordem muda a cada resposta.
  const sequence = useMemo(() => {
    const shuffled = [...allMessages].sort(() => Math.random() - 0.5)
    const count = 1 + Math.floor(Math.random() * shuffled.length)
    return shuffled.slice(0, count)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages])

  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setVisible(false)
    setIndex(0)

    // Demora um pouco mais pra primeira frase aparecer (fica só nos
    // pontinhos até lá)
    const firstDelay = 1800 + Math.random() * 1400
    const showTimer = setTimeout(() => setVisible(true), firstDelay)

    let cancelled = false
    let stepTimer: ReturnType<typeof setTimeout>

    const scheduleNext = (i: number) => {
      const delay = 3200 + Math.random() * 2200
      stepTimer = setTimeout(() => {
        if (cancelled) return
        setIndex((prev) => (prev < sequence.length - 1 ? prev + 1 : prev))
        if (i < sequence.length - 1) scheduleNext(i + 1)
      }, delay)
    }
    scheduleNext(0)

    return () => {
      cancelled = true
      clearTimeout(showTimer)
      clearTimeout(stepTimer)
    }
  }, [sequence])

  if (!visible) {
    return (
      <div className="flex items-center gap-1 py-1 px-0.5" role="status" aria-label="Pensando...">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-textMuted"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1 px-0.5" role="status" aria-label={sequence[index]}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-textMuted"
        >
          {sequence[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const streaming = isStreaming || message.isStreaming

  // Efeito de "digitação": a mensagem nasceu em streaming? então revela o
  // texto aos poucos até alcançar o conteúdo já recebido, em vez de jogar
  // tudo na tela de uma vez. Mensagens carregadas do histórico (que nunca
  // passaram por streaming) aparecem inteiras, sem animação.
  const everStreamedRef = useRef(streaming)
  const [displayedLength, setDisplayedLength] = useState(
    everStreamedRef.current ? 0 : message.content.length
  )

  useEffect(() => {
    if (!everStreamedRef.current) return
    const target = message.content.length
    if (displayedLength >= target) return

    const frame = requestAnimationFrame(() => {
      setDisplayedLength((prev) => {
        const gap = target - prev
        // avança uma fração do que falta a cada frame, com um mínimo de
        // 1 caractere — assim resposta grande "acelera" a digitação e
        // resposta curta não fica lenta demais
        const step = Math.max(gap * 0.08, 1)
        return Math.min(target, prev + step)
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [displayedLength, message.content])

  const displayedContent = everStreamedRef.current
    ? message.content.slice(0, Math.floor(displayedLength))
    : message.content
  const isTyping = everStreamedRef.current && displayedLength < message.content.length

  const timestamp = new Date().toISOString()
  console.log(`[SEND 33] [${timestamp}] [renderer] Message RENDER`, {
    messageId: message.id,
    role: message.role,
    contentLength: message.content.length,
    streaming,
    isStreamingProp: isStreaming,
    messageIsStreaming: message.isStreaming
  })

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
          <img src={turtlyImg} alt="Turtly" className="w-6 h-6 object-contain" />
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

          {streaming && !message.content ? (
            <TypingIndicator />
          ) : (
            <>
              <ReactMarkdown
                components={renderers}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {displayedContent}
              </ReactMarkdown>
              {isTyping && (
                <motion.span
                  className="inline-block w-[2px] h-4 -mb-0.5 bg-textMuted align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}