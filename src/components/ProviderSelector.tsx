'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Brain, Terminal, Globe, Sparkles, Loader2 } from 'lucide-react'
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

type ProviderValue = 'free-claude' | 'claude' | 'openai' | 'gemini' | 'local'

const PROVIDERS: {
  value: ProviderValue
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'free-claude',
    label: 'Free Claude (FCC)',
    description: 'Claude via proxy gratuito',
    icon: <Brain className="w-4 h-4" />,
  },
  {
    value: 'claude',
    label: 'Claude (Anthropic)',
    description: 'Modelos de última geração (requer login)',
    icon: <Brain className="w-4 h-4" />,
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT-4 e modelos avançados',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    description: 'Modelos multimodais',
    icon: <Globe className="w-4 h-4" />,
  },
  {
    value: 'local',
    label: 'Local (Ollama)',
    description: 'Modelos locais privados',
    icon: <Terminal className="w-4 h-4" />,
  },
]

const providerLabels: Record<ProviderValue, string> = {
  'free-claude': 'Free Claude',
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  local: 'Local',
}

interface ProviderSelectorProps {
  placeholder?: string
  disabled?: boolean
  minWidth?: number
  triggerClassName?: string
  className?: string
}

export function ProviderSelector({
  placeholder = 'Provedor',
  disabled = false,
  minWidth = 200,
  triggerClassName = '',
  className,
}: ProviderSelectorProps) {
  const { settings, updateSettings, currentChat, isChatGenerating } = useStore()

  const chatId = currentChat?.id
  const isGenerating = chatId ? isChatGenerating(chatId) : false

  // Local state for immediate UI feedback
  const [localProvider, setLocalProvider] = useState<ProviderValue>(
    settings.provider as ProviderValue
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredProvider, setHoveredProvider] = useState<ProviderValue | null>(null)
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

  // Sync local state with store
  useEffect(() => {
    setLocalProvider(settings.provider as ProviderValue)
  }, [settings.provider])

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
    if (!disabled && !isGenerating) {
      setIsOpen((prev) => !prev)
    }
  }, [disabled, isGenerating])

  const handleSelectProvider = useCallback(
    async (providerValue: ProviderValue) => {
      // Immediate local state update for instant UI feedback
      setLocalProvider(providerValue)

      // Persist to store
      updateSettings({ provider: providerValue })

      // Notify main process to switch active provider
      try {
        await window.electronAPI?.setActiveProvider(providerValue)
      } catch (error) {
        console.error('[ProviderSelector] Failed to set active provider:', error)
      }

      setIsOpen(false)
    },
    [updateSettings]
  )

  const currentProvider = PROVIDERS.find((p) => p.value === localProvider) || PROVIDERS[0]

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
            {PROVIDERS.map((provider) => (
              <motion.button
                key={provider.value}
                role="menuitem"
                onClick={() => handleSelectProvider(provider.value)}
                onMouseEnter={() => setHoveredProvider(provider.value)}
                onMouseLeave={() => setHoveredProvider(null)}
                variants={dropdownItemVariants}
                whileHover={{ x: 4, transition: transitions.snappy }}
                whileTap={{ scale: 0.98, transition: transitions.tweenFast }}
                className={cn(
                  'w-full px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                  'hover:bg-surfaceHover',
                  localProvider === provider.value && 'bg-primary/10 text-primary',
                  hoveredProvider === provider.value && 'bg-surfaceHover'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border border-glassBorder', localProvider === provider.value && 'border-primary/50')}>
                  {provider.icon}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="block truncate font-medium">{provider.label}</span>
                  <span className="block text-xs truncate text-textMuted">{provider.description}</span>
                </div>
                {localProvider === provider.value && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
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
        aria-label={`Provedor atual: ${providerLabels[currentProvider.value]}`}
      >
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {currentProvider.icon}
        </span>
        <span className="truncate max-w-[120px]">{currentProvider.label}</span>
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

export default ProviderSelector