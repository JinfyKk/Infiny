import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Gauge, Battery, Cpu, Zap, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } as const },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: 'easeIn' } as const }
} as const

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } as const }
} as const

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.05 }
  }
} as const

interface EffortOption {
  value: 'low' | 'medium' | 'high' | 'max' | 'xhigh'
  label: string
  description: string
  icon: React.ReactNode
}

const EFFORTS: EffortOption[] = [
  { value: 'low', label: 'Low', description: 'Respostas rápidas, menos tokens', icon: <Battery className="w-4 h-4" /> },
  { value: 'medium', label: 'Medium', description: 'Equilibrado', icon: <Gauge className="w-4 h-4" /> },
  { value: 'high', label: 'High', description: 'Mais detalhado e completo', icon: <Cpu className="w-4 h-4" /> },
  { value: 'max', label: 'Max', description: 'Máximo esforço', icon: <Zap className="w-4 h-4" /> },
  { value: 'xhigh', label: 'XHigh', description: 'Ultra detalhado', icon: <Activity className="w-4 h-4" /> },
]

interface EffortSelectorProps {
  effort: 'low' | 'medium' | 'high' | 'max' | 'xhigh'
  onChange: (effort: 'low' | 'medium' | 'high' | 'max' | 'xhigh') => void
  isOpen: boolean
  onToggle: () => void
}

export function EffortSelector({ effort, onChange, isOpen, onToggle }: EffortSelectorProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(EFFORTS.findIndex(e => e.value === effort))

  useEffect(() => {
    setSelectedIndex(EFFORTS.findIndex(e => e.value === effort))
  }, [effort])

  const currentEffort = EFFORTS.find(e => e.value === effort) || EFFORTS[1]

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
        <Gauge className="w-4 h-4" />
        <span className="truncate max-w-[80px] capitalize">{currentEffort.label}</span>
        <motion.div
          whileHover={{ rotate: isOpen ? 180 : 90 }}
          whileTap={{ rotate: isOpen ? 180 : -90, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 } as const}
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
            className="fixed z-50 mt-1.5 min-w-[180px]"
            role="menu"
          >
            <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
                <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Effort</span>
              </div>
              <motion.div
                className="py-1"
                role="menu"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {EFFORTS.map((e, idx) => (
                  <motion.button
                    key={e.value}
                    role="menuitem"
                    onClick={() => { onChange(e.value); onToggle() }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                      'hover:bg-surfaceHover',
                      idx === selectedIndex && 'bg-primarySoft text-primary',
                      effort === e.value && 'font-medium'
                    )}
                  >
                    <span className={cn('w-4 h-4 flex-shrink-0', effort === e.value ? 'text-primary' : 'text-textMuted')}>{e.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium capitalize">{e.label}</span>
                      <span className="block text-xs truncate text-textMuted">{e.description}</span>
                    </div>
                    {effort === e.value && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
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