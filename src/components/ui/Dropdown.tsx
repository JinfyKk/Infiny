import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  options: DropdownOption[]
  onSelect: (value: string) => void
  selectedValue?: string
  placeholder?: string
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, options, onSelect, selectedValue, placeholder, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (value: string) => {
    onSelect(value)
    setIsOpen(false)
  }

  const portalContent = (
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-50 mt-1.5 min-w-[180px] max-w-[280px]',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
      role="menu"
    >
      <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden animate-in fade-in-150 zoom-in-95 duration-150">
        {placeholder && (
          <div className="px-3 py-2 text-sm text-textMuted border-b border-glassBorder">
            {placeholder}
          </div>
        )}
        <div className="py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => !option.disabled && handleOptionClick(option.value)}
              disabled={option.disabled}
              role="menuitem"
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                'transition-colors duration-100',
                'hover:bg-surfaceHover',
                'focus:outline-none focus:bg-surfaceHover',
                option.danger ? 'text-error' : 'text-textPrimary',
                option.disabled && 'opacity-50 cursor-not-allowed',
                selectedValue === option.value && 'bg-primary/10 text-primary'
              )}
            >
              {option.icon && <span className="flex-shrink-0 h-4 w-4">{option.icon}</span>}
              <span className="flex-1 truncate">{option.label}</span>
              {selectedValue === option.value && <Check className="h-4 w-4 flex-shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>
      {isOpen && createPortal(portalContent, document.body)}
    </div>
  )
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
  sections: Array<{
    title: string
    items: Array<{
      label: string
      description?: string
      shortcut?: string
      action: () => void
      icon?: React.ReactNode
    }>
  }>
}

export function CommandPalette({ isOpen, onClose, onSearch, sections }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<HTMLButtonElement[]>([])

  const allItems = sections.flatMap((section) => section.items)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    onSearch(query)
  }, [query, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const visibleItems = allItems.length
    if (visibleItems === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % visibleItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + visibleItems) % visibleItems)
        break
      case 'Enter':
        e.preventDefault()
        allItems[selectedIndex]?.action()
        onClose()
        break
      case 'Escape':
        onClose()
        break
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" onClick={(e) => e.stopPropagation()} />
      <div
        className="relative glass rounded-2xl border border-glassBorder shadow-2xl w-full max-w-2xl max-h-[60vh] overflow-hidden animate-in fade-in-200 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-glassBorder">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite um comando ou pesquise..."
              className="w-full bg-surface/50 border border-border rounded-lg px-4 py-3 text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-surface border border-border rounded text-xs text-textMuted font-mono">Esc</kbd>
          </div>
        </div>
        <div className="max-h-[calc(60vh-80px)] overflow-y-auto p-2">
          {sections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-4">
              <h3 className="px-3 py-1 text-xs font-semibold text-textMuted uppercase tracking-wider">{section.title}</h3>
              {section.items.map((item, itemIndex) => {
                const globalIndex = sections.slice(0, sectionIndex).reduce((acc, s) => acc + s.items.length, 0) + itemIndex
                const isSelected = globalIndex === selectedIndex
                return (
                  <button
                    key={item.label}
                    ref={(el) => { itemsRef.current[globalIndex] = el! }}
                    onClick={() => { item.action(); onClose() }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors duration-100',
                      'hover:bg-surfaceHover',
                      isSelected && 'bg-primary/10 text-primary'
                    )}
                  >
                    {item.icon && <span className="flex-shrink-0 h-4 w-4 text-textMuted">{item.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <span className={cn('truncate block', isSelected ? 'text-textPrimary' : 'text-textSecondary')}>{item.label}</span>
                      {item.description && (
                        <span className="truncate block text-xs text-textMuted">{item.description}</span>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="flex-shrink-0 px-2 py-0.5 bg-surface border border-border rounded text-xs text-textMuted font-mono">{item.shortcut}</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          {allItems.length === 0 && (
            <div className="px-3 py-8 text-center text-textMuted">Nenhum comando encontrado</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}