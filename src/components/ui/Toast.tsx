import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { springTransition } from '@/lib/transitions'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration ?? 4000)
    }
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const helpers = {
    success: (title: string, description?: string) => addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) => addToast({ type: 'error', title, description }),
    info: (title: string, description?: string) => addToast({ type: 'info', title, description }),
    warning: (title: string, description?: string) => addToast({ type: 'warning', title, description }),
    addToast,
    removeToast,
    toasts,
  }

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}

export function useToastHelpers() {
  const { success, error, info, warning } = useToast()
  return { success, error, info, warning }
}

const toastVariants = {
  hidden: { opacity: 0, x: 300, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: springTransition.smooth },
  exit: { opacity: 0, x: 300, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
} as const

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { ...springTransition.snappy, delay: 0.1 } }
} as const

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificações"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    info: <Info className="w-5 h-5 text-info" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  }

  const bgColors = {
    success: 'bg-success/10 border-success/20',
    error: 'bg-error/10 border-error/20',
    info: 'bg-info/10 border-info/20',
    warning: 'bg-warning/10 border-warning/20',
  }

  return (
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-[320px] max-w-[90vw] p-4 rounded-xl border shadow-xl',
        'glass',
        bgColors[toast.type]
      )}
      role="alert"
    >
      <motion.div variants={iconVariants} initial="hidden" animate="visible" className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-textSecondary text-sm mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg text-textMuted hover:text-textPrimary hover:bg-black/5 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}