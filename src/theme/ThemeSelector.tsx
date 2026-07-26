'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, Palette, Sun, Moon, Monitor, Zap, Circle as LucideCircle, TreePine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'
import { ThemeName, themeLabels, themeDescriptions } from './themes'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  dropdownVariants,
  dropdownItemVariants,
  staggerContainerVariants,
  transitions,
} from '@/lib/transitions'

export function ThemeSelector() {
  const { theme, setTheme, availableThemes } = useTheme()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null)
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const updatePortalPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPortalPosition({ top: rect.bottom + 6, left: rect.left })
      console.log('[ThemeSelector][BUG1] Portal position calculated', {
        triggerRect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
        portalPosition: { top: rect.bottom + 6, left: rect.left },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      })
    }
  }, [])

  const currentThemeLabel = themeLabels[theme]

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let listenerAttached = false

    function handleClickOutside(event: MouseEvent) {
      console.log('[ThemeSelector][BUG1] 🎯 CLICK OUTSIDE HANDLER FIRED', {
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
        !dropdownRef.current.contains(event.target as Node) &&
        !event.composedPath().includes(triggerRef.current)
      ) {
        console.log('[ThemeSelector][BUG1] ✅ CLOSING DROPDOWN via click outside')
        setIsOpen(false)
      } else {
        console.log('[ThemeSelector][BUG1] ❌ IGNORING CLICK (inside trigger or dropdown)')
      }
    }

    if (isOpen) {
      console.log('[ThemeSelector][BUG1] 📝 REGISTERING CLICK OUTSIDE LISTENER (setTimeout 0)')
      timer = setTimeout(() => {
        listenerAttached = true
        console.log('[ThemeSelector][BUG1] 📝 LISTENER ACTUALLY ATTACHED NOW')
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      return () => {
        clearTimeout(timer!)
        if (listenerAttached) {
          console.log('[ThemeSelector][BUG1] 🧹 CLEANUP: removing listener')
          document.removeEventListener('mousedown', handleClickOutside)
        }
      }
    }
  }, [isOpen])

  // === DIAGNOSTIC LOGS - BUG 1 ===
  const handleToggle = useCallback(() => {
    console.log('[ThemeSelector][BUG1] ▶▶▶ TOGGLE CALLED', {
      isOpenBefore: isOpen,
      triggerRef: triggerRef.current ? 'exists' : 'null',
      dropdownRef: dropdownRef.current ? 'exists' : 'null',
    })
    setIsOpen((prev) => {
      const next = !prev
      console.log('[ThemeSelector][BUG1] ▶▶▶ ISOPEN CHANGED', { before: prev, after: next })
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        console.log('[ThemeSelector][BUG1] Portal position', {
          triggerRect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
          expectedTop: rect.bottom + 6,
          expectedLeft: rect.left,
        })
      }
      return next
    })
  }, [isOpen])

  const handleSelectTheme = useCallback((newTheme: ThemeName) => {
    setTheme(newTheme)
    setIsOpen(false)
  }, [setTheme])

  const themeOptions = availableThemes.map((themeId) => {
    const isActive = theme === themeId
    const isHovered = hoveredTheme === themeId
    return {
      value: themeId,
      label: themeLabels[themeId],
      description: themeDescriptions[themeId],
      isActive,
      isHovered,
    }
  })

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
        className="fixed z-50 min-w-[220px]"
        role="menu"
        transition={shouldReduceMotion ? { duration: 0 } : undefined}
        style={{
          pointerEvents: 'auto',
          ...(portalPosition ? { top: portalPosition.top, left: portalPosition.left } : {}),
        }}
      >
      <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Tema</span>
        </div>
        <motion.div
          className="py-1"
          role="menu"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          transition={shouldReduceMotion ? { duration: 0 } : undefined}
        >
          {themeOptions.map((option) => (
            <motion.button
              key={option.value}
              role="menuitem"
              onClick={() => handleSelectTheme(option.value as ThemeName)}
              onMouseEnter={() => setHoveredTheme(option.value as ThemeName)}
              onMouseLeave={() => setHoveredTheme(null)}
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
                {getThemePreviewIcon(option.value as ThemeName)}
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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          isOpen
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-surface border-border text-textSecondary hover:bg-surfaceHover hover:text-textPrimary hover:border-borderHover'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Tema atual: ${currentThemeLabel}`}
      >
        <Palette className="w-4 h-4" />
        <span className="truncate max-w-[100px]">{currentThemeLabel}</span>
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

      <AnimatePresence>{createPortal(portalContent, document.body)}</AnimatePresence>
    </div>
  )
}

function getThemePreviewIcon(themeId: ThemeName) {
  switch (themeId) {
    case 'turtly-light':
      return <Sun className="w-4 h-4 text-amber-500" />
    case 'turtly-forest':
      return <TreePine className="w-4 h-4 text-green-600" />
    case 'pampas':
      return <Sun className="w-4 h-4 text-amber-600" />
    case 'dark-premium':
      return <Moon className="w-4 h-4 text-slate-400" />
    case 'tech-blue':
      return <Monitor className="w-4 h-4 text-blue-500" />
    case 'natural-green':
      return <Sun className="w-4 h-4 text-emerald-600" />
    case 'monochrome':
      return <LucideCircle className="w-4 h-4 text-neutral-600" />
    case 'futuristic':
      return <Zap className="w-4 h-4 text-cyan-400" />
    default:
      return <Palette className="w-4 h-4 text-textMuted" />
  }
}

export default ThemeSelector