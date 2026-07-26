'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Gauge, Battery, Cpu, Zap, Activity, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { motion, useReducedMotion } from 'framer-motion'
import {
  dropdownVariants,
  dropdownItemVariants,
  staggerContainerVariants,
  transitions,
} from '@/lib/transitions'
import { useDropdownPosition } from '@/hooks/useDropdownPosition'

type EffortValue = 'low' | 'medium' | 'high' | 'max' | 'xhigh' | 'ultracode'

const EFFORTS = [
  { value: 'low', label: 'Low', description: 'Respostas rápidas, menos tokens', icon: <Battery className="w-4 h-4" /> },
  { value: 'medium', label: 'Medium', description: 'Equilibrado', icon: <Gauge className="w-4 h-4" /> },
  { value: 'high', label: 'High', description: 'Mais detalhado e completo', icon: <Cpu className="w-4 h-4" /> },
  { value: 'max', label: 'Max', description: 'Máximo esforço', icon: <Zap className="w-4 h-4" /> },
  { value: 'xhigh', label: 'XHigh', description: 'Ultra detalhado', icon: <Activity className="w-4 h-4" /> },
  { value: 'ultracode', label: 'Ultracode', description: 'Máximo poder de codificação', icon: <BrainCircuit className="w-4 h-4" /> },
] as const

interface EffortSelectorProps {
  placeholder?: string
  disabled?: boolean
  minWidth?: number
  triggerClassName?: string
  className?: string
}

export function EffortSelector({
  placeholder = 'Effort',
  disabled = false,
  minWidth = 180,
  triggerClassName = '',
  className,
}: EffortSelectorProps) {
  const { settings, updateSettings, currentChat, isChatGenerating } = useStore()

  const chatId = currentChat?.id
  const isGenerating = chatId ? isChatGenerating(chatId) : false

  // Local state for immediate UI feedback
  const [localEffort, setLocalEffort] = useState<EffortValue>(settings.effort)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredEffort, setHoveredEffort] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const {
    left,
    top,
    placement,
    maxHeight,
    dropdownRef,
  } = useDropdownPosition(triggerRef, {
    isOpen,
    minWidth,
    margin: 8,
    maxWidth: 280,
  })

  // Sync local state with store when store changes
  useEffect(() => {
    setLocalEffort(settings.effort)
  }, [settings.effort])

  const currentEffort = EFFORTS.find((e) => e.value === localEffort) || EFFORTS[1]
  const effortLabels: Record<EffortValue, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    max: 'Max',
    xhigh: 'XHigh',
    ultracode: 'Ultracode',
  }

  const handleSelect = useCallback(
    (effortValue: EffortValue) => {
      // Immediate local update for instant UI feedback
      setLocalEffort(effortValue)
      // Persist to store
      updateSettings({ effort: effortValue })
      close()
    },
    [updateSettings]
  )

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleToggle = useCallback(() => {
    if (!disabled && !isGenerating) {
      setIsOpen((prev) => !prev)
    }
  }, [disabled, isGenerating])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        close()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, close])

  const effortOptions = EFFORTS.map((effort) => ({
    value: effort.value,
    label: effort.label,
    description: effort.description,
    icon: effort.icon,
    isActive: localEffort === effort.value,
    isHovered: hoveredEffort === effort.value,
  }))

  const portalContent = isOpen ? (
    <>
      <motion.div
        ref={dropdownRef as any}
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed z-50 min-w-[180px]"
        role="menu"
        transition={shouldReduceMotion ? { duration: 0 } : undefined}
        style={{
          pointerEvents: 'auto',
          maxHeight: `${maxHeight}px`,
          top,
          left,
        }}
      >
        <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
            <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">{placeholder}</span>
          </div>
          <motion.div
            className="py-1 overflow-y-auto"
            role="menu"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
            style={{ maxHeight: `${maxHeight - 80}px` }}
          >
            {effortOptions.map((option) => (
              <motion.button
                key={option.value}
                role="menuitem"
                onClick={() => handleSelect(option.value as EffortValue)}
                onMouseEnter={() => setHoveredEffort(option.value)}
                onMouseLeave={() => setHoveredEffort(null)}
                variants={dropdownItemVariants}
                whileHover={{ x: 4, transition: transitions.snappy }}
                whileTap={{ scale: 0.98, transition: transitions.tweenFast }}
                className={cn(
                  'w-full px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                  'hover:bg-surfaceHover',
                  option.isActive && 'bg-primary/10 text-primary',
                  option.isHovered && 'bg-surfaceHover'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border border-glassBorder', option.isActive && 'border-primary/50')}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="block truncate font-medium">{option.label}</span>
                  <span className="block text-xs truncate text-textMuted">{option.description}</span>
                </div>
                {option.isActive && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </>
  ) : null

  const chevronRotation = placement === 'top' ? 180 : 0

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        disabled={disabled || isGenerating}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          disabled || isGenerating
            ? 'opacity-50 cursor-not-allowed bg-surface border-border text-textMuted'
            : isOpen
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-surface border-border text-textSecondary hover:bg-surfaceHover hover:text-textPrimary hover:border-borderHover',
          triggerClassName
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-disabled={disabled || isGenerating}
        aria-label={`Nível de esforço atual: ${effortLabels[localEffort]}`}
      >
        {currentEffort.icon}
        <span className="truncate max-w-[100px]">{currentEffort.label}</span>
        <motion.div
          animate={{ rotate: chevronRotation }}
          transition={shouldReduceMotion ? { duration: 0 } : transitions.snappy}
          className="w-4 h-4 flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>
      </button>

      {portalContent && createPortal(portalContent, document.body)}
    </div>
  )
}

export default EffortSelector