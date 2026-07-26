'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DropdownOption } from '@/components/ui/Dropdown'
import { Brain, Terminal, Globe, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import {
  dropdownVariants,
  dropdownItemVariants,
  staggerContainerVariants,
  transitions,
} from '@/lib/transitions'
import { useStore } from '@/store/infinyStore'

type ProviderValue = 'free-claude' | 'claude' | 'openai' | 'gemini' | 'local'

const PROVIDERS: DropdownOption[] = [
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

export function ProviderSelector() {
  const { settings, updateSettings, currentChat, isChatGenerating } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const chatId = currentChat?.id
  const isGenerating = chatId ? isChatGenerating(chatId) : false

  const updatePortalPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPortalPosition({ top: rect.bottom + 6, left: rect.left })
      console.log('[ProviderSelector][BUG1] Portal position calculated', {
        triggerRect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
        portalPosition: { top: rect.bottom + 6, left: rect.left },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      })
    }
  }, [])

  const currentProvider = settings.provider as ProviderValue
  const currentProviderOption = PROVIDERS.find((p) => p.value === currentProvider) || PROVIDERS[0]

  useEffect(() => {
    const idx = PROVIDERS.findIndex((p) => p.value === currentProvider)
    setSelectedIndex(idx >= 0 ? idx : 0)
  }, [currentProvider])

  // === DIAGNOSTIC LOGS - BUG 1 ===
  const handleToggle = useCallback(() => {
    if (!isGenerating) {
      console.log('[ProviderSelector][BUG1] ▶▶▶ TOGGLE CALLED', {
        isGenerating,
        isOpenBefore: isOpen,
        triggerRef: triggerRef.current ? 'exists' : 'null',
        dropdownRef: dropdownRef.current ? 'exists' : 'null',
      })
      setIsOpen((prev) => {
        const next = !prev
        console.log('[ProviderSelector][BUG1] ▶▶▶ ISOPEN CHANGED', { before: prev, after: next })
        if (next && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect()
          console.log('[ProviderSelector][BUG1] Portal position', {
            triggerRect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
            expectedTop: rect.bottom + 6,
            expectedLeft: rect.left,
          })
        }
        return next
      })
    }
  }, [isGenerating, isOpen])

  const handleSelect = useCallback(
    async (providerValue: string) => {
      updateSettings({ provider: providerValue as ProviderValue })
      // Notify main process to switch active provider
      try {
        await window.electronAPI?.setActiveProvider(providerValue as ProviderValue)
      } catch (error) {
        console.error('[ProviderSelector] Failed to set active provider:', error)
      }
      setIsOpen(false)
    },
    [updateSettings]
  )

  // Click outside to close
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let listenerAttached = false

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      console.log('[ProviderSelector][BUG1] 🎯 CLICK OUTSIDE HANDLER FIRED', {
        eventType: event.type,
        target: event.target,
        targetTag: (event.target as Element)?.tagName,
        targetId: (event.target as Element)?.id,
        targetClass: (event.target as HTMLElement)?.className,
        composedPath: event.composedPath?.().map((el: any) => el.tagName || el.nodeName).slice(0, 8),
        triggerRef: triggerRef.current ? 'exists' : 'null',
        dropdownRef: dropdownRef.current ? 'exists' : 'null',
        triggerContains: triggerRef.current?.contains(event.target as Node),
        dropdownContains: dropdownRef.current?.contains(event.target as Node),
        listenerAttached,
        isOpen,
      })

      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        console.log('[ProviderSelector][BUG1] ✅ CLOSING DROPDOWN via click outside')
        setIsOpen(false)
      } else {
        console.log('[ProviderSelector][BUG1] ❌ IGNORING CLICK (inside trigger or dropdown)')
      }
    }

    if (isOpen) {
      console.log('[ProviderSelector][BUG1] 📝 REGISTERING CLICK OUTSIDE LISTENER (setTimeout 0)')
      timer = setTimeout(() => {
        listenerAttached = true
        console.log('[ProviderSelector][BUG1] 📝 LISTENER ACTUALLY ATTACHED NOW')
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
      }, 0)
      return () => {
        clearTimeout(timer!)
        if (listenerAttached) {
          console.log('[ProviderSelector][BUG1] 🧹 CLEANUP: removing listeners')
          document.removeEventListener('mousedown', handleClickOutside)
          document.removeEventListener('touchstart', handleClickOutside)
        }
      }
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, PROVIDERS.length - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (PROVIDERS[selectedIndex] && !PROVIDERS[selectedIndex].disabled) {
            handleSelect(PROVIDERS[selectedIndex].value)
          }
          break
        case 'Escape':
          setIsOpen(false)
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, handleSelect])

  // Focus trigger when closed
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const portalContent = isOpen ? (
    <>
      {triggerRef.current && (() => {
        updatePortalPosition()
        return null
      })()}
      <motion.div
        ref={dropdownRef}
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={shouldReduceMotion ? { duration: 0 } : undefined}
        className={cn('fixed z-50 min-w-[200px] max-h-[300px]')}
        role="menu"
        style={{
          pointerEvents: 'auto',
          ...(portalPosition ? { top: portalPosition.top, left: portalPosition.left } : {}),
        }}
      >
      <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Provedor</span>
        </div>
        <motion.div
          className="py-1 overflow-y-auto"
          role="menu"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          transition={shouldReduceMotion ? { duration: 0 } : undefined}
        >
          {PROVIDERS.map((option, idx) => (
            <motion.button
              key={option.value}
              role="menuitem"
              disabled={option.disabled || isGenerating}
              onClick={() => !option.disabled && !isGenerating && handleSelect(option.value)}
              onMouseEnter={() => setSelectedIndex(idx)}
              variants={dropdownItemVariants}
              whileHover={{ x: 4, transition: transitions.snappy }}
              whileTap={{ scale: 0.98, transition: transitions.tweenFast }}
              className={cn(
                'w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                'hover:bg-surfaceHover',
                idx === selectedIndex && 'bg-primary/10 text-primary',
                currentProvider === option.value && 'font-medium',
                option.disabled && 'opacity-50 cursor-not-allowed',
              )}
              aria-selected={currentProvider === option.value}
            >
              <span className={cn('w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg', currentProvider === option.value ? 'bg-primary/10' : 'bg-surfaceHover')}>
                {option.icon}
              </span>
              <div className="flex-1 min-w-0 text-left">
                <span className="block truncate font-medium">{option.label}</span>
                <span className="block text-xs truncate text-textMuted">{option.description}</span>
              </div>
              {currentProvider === option.value && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={transitions.bouncy}
                  className="w-5 h-5 flex-shrink-0 text-primary"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  </>
) : null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        disabled={isGenerating}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          isGenerating
            ? 'opacity-50 cursor-not-allowed bg-surface border-border text-textMuted'
            : isOpen
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-surface border-border text-textSecondary hover:bg-surfaceHover hover:text-textPrimary hover:border-borderHover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-disabled={isGenerating}
        aria-label={`Provedor atual: ${providerLabels[currentProvider]}`}
      >
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {currentProviderOption.icon}
        </span>
        <span className="truncate max-w-[120px]">{currentProviderOption.label}</span>
        <motion.div
          whileHover={{ rotate: isOpen ? 180 : 90 }}
          whileTap={{ rotate: isOpen ? 180 : -90, scale: 0.9 }}
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