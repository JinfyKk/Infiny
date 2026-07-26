'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Brain, Loader2 } from 'lucide-react'
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

interface ModelOption {
  value: string
  label: string
  description?: string
  provider?: string
}

interface ModelSelectorProps {
  placeholder?: string
  disabled?: boolean
  minWidth?: number
  triggerClassName?: string
  className?: string
  fetchModels?: () => Promise<ModelOption[]>
}

export function ModelSelector({
  placeholder = 'Modelo',
  disabled = false,
  minWidth = 200,
  triggerClassName = '',
  className,
  fetchModels,
}: ModelSelectorProps) {
  const { settings, updateSettings, currentChat, isChatGenerating } = useStore()

  const chatId = currentChat?.id
  const isGenerating = chatId ? isChatGenerating(chatId) : false

  // Local state for immediate UI feedback
  const [localModel, setLocalModel] = useState<string>(settings.model)
  const [models, setModels] = useState<ModelOption[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredModel, setHoveredModel] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const THEME_MENU_WIDTH = 220

  const {
    left,
    top,
    placement,
    maxHeight,
    dropdownRef,
  } = useDropdownPosition(triggerRef, {
    isOpen,
    minWidth: Math.max(THEME_MENU_WIDTH, minWidth),
    margin: 8,
    maxWidth: 320,
  })

  // Sync local state with store when store changes
  useEffect(() => {
    setLocalModel(settings.model)
  }, [settings.model])

  // Load models when component mounts or provider changes
  useEffect(() => {
    let mounted = true

    const loadModels = async () => {
      if (!fetchModels) return
      setIsLoadingModels(true)
      try {
        const fetchedModels = await fetchModels()
        if (mounted) {
          setModels(fetchedModels)
        }
      } catch (error) {
        console.error('[ModelSelector] Failed to load models:', error)
        if (mounted) {
          setModels([])
        }
      } finally {
        if (mounted) {
          setIsLoadingModels(false)
        }
      }
    }

    loadModels()
    return () => {
      mounted = false
    }
  }, [fetchModels, settings.provider])

  // Find current model for display
  const currentModel = models.find((m) => m.value === localModel) || {
    value: localModel,
    label: localModel || placeholder,
    description: '',
  }

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
        setIsOpen(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev)
    }
  }, [disabled])

  const handleSelectModel = useCallback(
    (modelValue: string) => {
      // Immediate local state update for instant UI feedback
      setLocalModel(modelValue)
      // Persist to store
      updateSettings({ model: modelValue })
      setIsOpen(false)
    },
    [updateSettings]
  )

  const modelOptions = models.map((model) => ({
    value: model.value,
    label: model.label,
    description: model.description,
    provider: model.provider,
    isActive: localModel === model.value,
    isHovered: hoveredModel === model.value,
  }))

  const portalContent = isOpen ? (
    <>
      <motion.div
        ref={dropdownRef as any}
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed z-50 min-w-[220px]"
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
            <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">
              {isLoadingModels ? 'Carregando modelos...' : 'Modelo'}
            </span>
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
            {isLoadingModels ? (
              <div className="px-3 py-4 flex items-center gap-2 text-textMuted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando modelos disponíveis...
              </div>
            ) : models.length === 0 ? (
              <div className="px-3 py-4 text-center text-textMuted text-sm">
                Nenhum modelo disponível para este provedor
              </div>
            ) : (
              modelOptions.map((option) => (
                <motion.button
                  key={option.value}
                  role="menuitem"
                  onClick={() => handleSelectModel(option.value)}
                  onMouseEnter={() => setHoveredModel(option.value)}
                  onMouseLeave={() => setHoveredModel(null)}
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
                    {option.description && option.provider ? (
                      <span className="text-xs font-mono text-textMuted">
                        {option.provider}
                      </span>
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.description && (
                      <span className="block text-xs truncate text-textMuted">{option.description}</span>
                    )}
                  </div>
                  {option.isActive && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
                </motion.button>
              ))
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  ) : null

  // Icon rotation based on placement
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
        aria-label={`Modelo atual: ${currentModel.label}`}
      >
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          <Brain className="w-4 h-4" />
        </span>
        <span className="truncate max-w-[120px]">{currentModel.label}</span>
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

export default ModelSelector