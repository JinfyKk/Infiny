import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Palette, ChevronDown, Sun, Moon, Monitor, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'
import { ThemeName, themeLabels, themeDescriptions } from './themes'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } as const },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: 'easeIn' } as const }
} as const

const themeItemVariants = {
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

export function ThemeSelector() {
  const { theme, setTheme, availableThemes } = useTheme()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectTheme = (newTheme: ThemeName) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  const currentThemeLabel = themeLabels[theme]

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          isOpen
            ? 'bg-primarySoft border-primary text-primary'
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
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 } as const}
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
              >
                {availableThemes.map((themeId) => (
                  <motion.button
                    key={themeId}
                    role="menuitem"
                    onClick={() => handleSelectTheme(themeId)}
                    onMouseEnter={() => setHoveredTheme(themeId)}
                    onMouseLeave={() => setHoveredTheme(null)}
                    variants={themeItemVariants}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                      'hover:bg-surfaceHover',
                      theme === themeId && 'bg-primarySoft text-primary',
                      hoveredTheme === themeId && 'bg-surfaceHover'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border border-glassBorder', theme === themeId && 'border-primary/50')}>
                      {getThemePreviewIcon(themeId)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="block truncate font-medium">{themeLabels[themeId]}</span>
                      <span className="block text-xs truncate text-textMuted">{themeDescriptions[themeId]}</span>
                    </div>
                    {theme === themeId && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
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
      return <Circle className="w-4 h-4 text-neutral-600" />
    case 'futuristic':
      return <Zap className="w-4 h-4 text-cyan-400" />
    default:
      return <Palette className="w-4 h-4 text-textMuted" />
  }
}

function Circle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
}