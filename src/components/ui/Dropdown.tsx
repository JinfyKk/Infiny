'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dropdownVariants,
  dropdownItemVariants,
  staggerContainerVariants,
  transitions,
} from '@/lib/transitions'

export interface DropdownOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  triggerLabel: string
  triggerIcon?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  minWidth?: number
  maxHeight?: number
  triggerClassName?: string
  className?: string
}

export function Dropdown({
  value,
  onChange,
  options,
  triggerLabel,
  triggerIcon,
  placeholder,
  disabled = false,
  ariaLabel,
  minWidth = 200,
  maxHeight = 300,
  triggerClassName = '',
  className,
}: DropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  // Memoize display options
  const displayOptions = useMemo(() => options.length > 0 ? options : [], [options])

  useEffect(() => {
    const idx = displayOptions.findIndex((o) => o.value === value)
    setSelectedIndex(idx >= 0 ? idx : 0)
  }, [value, displayOptions])

  const toggle = useCallback(() => {
    if (!disabled) setIsOpen((prev) => !prev)
  }, [disabled])

  const close = useCallback(() => setIsOpen(false), [])

  const handleSelect = useCallback(
    (optionValue: string) => {
      const option = displayOptions.find((o) => o.value === optionValue)
      if (option && !option.disabled) {
        onChange(optionValue)
      }
      close()
    },
    [displayOptions, onChange, close]
  )

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !event.composedPath().includes(triggerRef.current)
      ) {
        close()
      }
    }

    if (isOpen) {
      // Use setTimeout to avoid race condition between click and mousedown
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
      }, 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [isOpen, close])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, displayOptions.length - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (displayOptions[selectedIndex] && !displayOptions[selectedIndex].disabled) {
            handleSelect(displayOptions[selectedIndex].value)
          }
          break
        case 'Escape':
          close()
          break
        case 'Tab':
          close()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, displayOptions, selectedIndex, handleSelect, close])

  // Focus trigger when closed
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [isOpen])

  const portalContent = isOpen ? (
    <motion.div
      ref={dropdownRef}
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={cn(
        'fixed z-50 mt-1.5',
        `min-w-[${minWidth}px] max-h-[${maxHeight}px]`,
        className
      )}
      role="menu"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
        {placeholder && (
          <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
            <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">
              {placeholder}
            </span>
          </div>
        )}
        <motion.div
          className="py-1 overflow-y-auto"
          role="menu"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          transition={shouldReduceMotion ? { duration: 0 } : undefined}
        >
          {displayOptions.map((option, idx) => (
            <motion.button
              key={option.value}
              role="menuitem"
              disabled={option.disabled || disabled}
              onClick={() => !option.disabled && !disabled && handleSelect(option.value)}
              onMouseEnter={() => setSelectedIndex(idx)}
              variants={dropdownItemVariants}
              whileHover={{ x: 4, transition: transitions.snappy }}
              whileTap={{ scale: 0.98, transition: transitions.tweenFast }}
              className={cn(
                'w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                'hover:bg-surfaceHover',
                idx === selectedIndex && 'bg-primary/10 text-primary',
                value === option.value && 'font-medium',
                option.disabled && 'opacity-50 cursor-not-allowed',
                option.danger && 'text-error'
              )}
              aria-selected={value === option.value}
            >
              <span className={cn('w-4 h-4 flex-shrink-0', value === option.value ? 'text-primary' : 'text-textMuted')}>
                {option.icon ||
                  (option.danger ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  ))}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-medium">{option.label}</span>
                {option.description && (
                  <span className="block text-xs truncate text-textMuted">{option.description}</span>
                )}
              </div>
              {value === option.value && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
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
        onClick={toggle}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-surface border-border text-textMuted'
            : isOpen
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-surface border-border text-textSecondary hover:bg-surfaceHover hover:text-textPrimary hover:border-borderHover',
          triggerClassName
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        aria-label={ariaLabel}
      >
        {triggerIcon}
        <span className="truncate max-w-[120px]">{triggerLabel || placeholder || 'Selecionar'}</span>
        <motion.div
          whileHover={{ rotate: isOpen ? 180 : 90 }}
          whileTap={{ rotate: isOpen ? 180 : -90, scale: 0.9 }}
          transition={transitions.snappy}
          className="w-4 h-4 flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>{createPortal(portalContent, document.body)}</AnimatePresence>
    </div>
  )
}

export default Dropdown