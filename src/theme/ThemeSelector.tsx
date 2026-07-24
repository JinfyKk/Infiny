'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Palette, Sun, Moon, Monitor, Zap, Circle as LucideCircle } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const currentThemeLabel = themeLabels[theme]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !event.composedPath().includes(triggerRef.current)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Use setTimeout to avoid race condition between click and mousedown
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleSelectTheme = (newTheme: ThemeName) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

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
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed z-50 mt-1.5 min-w-[220px]"
      role="menu"
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
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
  ) : null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
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