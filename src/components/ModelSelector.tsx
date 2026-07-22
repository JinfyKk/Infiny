import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Brain, Zap, Sparkles, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: 'easeIn' } }
} as const

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
} as const

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.05 }
  }
} as const

interface ModelOption {
  value: string
  label: string
  description: string
  icon: React.ReactNode
}

const MODELS: ModelOption[] = [
  { value: 'claude-fable-5', label: 'Claude Fable 5', description: 'Mais avançado', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8', description: 'Alta complexidade', icon: <Brain className="w-4 h-4" /> },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5', description: 'Equilibrado', icon: <Cpu className="w-4 h-4" /> },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Rápido e eficiente', icon: <Zap className="w-4 h-4" /> },
]

interface ModelSelectorProps {
  model: string
  onChange: (model: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function ModelSelector({ model, onChange, isOpen, onToggle }: ModelSelectorProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(MODELS.findIndex(m => m.value === model))

  useEffect(() => {
    setSelectedIndex(MODELS.findIndex(m => m.value === model))
  }, [model])

  const currentModel = MODELS.find(m => m.value === model) || MODELS[0]

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          isOpen
            ? 'bg-primarySoft border-primary text-primary'
            : 'bg-surface border-border text-textSecondary hover:bg-surfaceHover hover:text-textPrimary hover:border-borderHover'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Brain className="w-4 h-4" />
        <span className="truncate max-w-[100px]">{currentModel.label}</span>
        <motion.div
          whileHover={{ rotate: isOpen ? 180 : 90 }}
          whileTap={{ rotate: isOpen ? 180 : -90, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && createPortal(
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-50 mt-1.5 min-w-[200px]"
            role="menu"
          >
            <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
                <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Modelo</span>
              </div>
              <motion.div
                className="py-1"
                role="menu"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {MODELS.map((m, idx) => (
                  <motion.button
                    key={m.value}
                    role="menuitem"
                    onClick={() => { onChange(m.value); onToggle() }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                      'hover:bg-surfaceHover',
                      idx === selectedIndex && 'bg-primarySoft text-primary',
                      model === m.value && 'font-medium'
                    )}
                  >
                    <span className={cn('w-4 h-4 flex-shrink-0', model === m.value ? 'text-primary' : 'text-textMuted')}>{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{m.label}</span>
                      <span className="block text-xs truncate text-textMuted">{m.description}</span>
                    </div>
                    {model === m.value && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  )
}