import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Brain, Zap, Sparkles, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModelOption {
  value: string
  label: string
  description: string
  icon: React.ReactNode
}

const MODELS: ModelOption[] = [
  { value: 'claude-fable-5', label: 'Claude Fable 5', description: 'Mais avançado', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8', description: 'Alta complexidade', icon: <Brain className="w-4 h-4" /> },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5', description: 'Equilibrado', icon: <Cpu className="w-4 h-4" /> },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Rápido e eficiente', icon: <Zap className="w-4 h-4" /> },
]

interface ModelSelectorProps {
  model: string
  onChange: (model: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function ModelSelector({ model, onChange, isOpen, onToggle }: ModelSelectorProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(MODELS.findIndex(m => m.value === model))

  useEffect(() => {
    setSelectedIndex(MODELS.findIndex(m => m.value === model))
  }, [model])

  const currentModel = MODELS.find(m => m.value === model) || MODELS[0]

  const menuContent = (
    <div className="fixed z-50 mt-1.5 min-w-[200px] animate-in fade-in-150 zoom-in-95 duration-150">
      <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Modelo</span>
        </div>
        <div className="py-1" role="menu">
          {MODELS.map((m, idx) => (
            <button
              key={m.value}
              role="menuitem"
              onClick={() => { onChange(m.value); onToggle() }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                'w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                'hover:bg-surfaceHover',
                idx === selectedIndex && 'bg-primary/10 text-primary',
                model === m.value && 'font-medium'
              )}
            >
              <span className={cn('w-4 h-4 flex-shrink-0', model === m.value ? 'text-primary' : 'text-textMuted')}>{m.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-medium">{m.label}</span>
                <span className="block text-xs truncate text-textMuted">{m.description}</span>
              </div>
              {model === m.value && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-lg border transition-colors duration-150',
          'font-medium text-sm',
          isOpen
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-surface border-border text-textSecondary hover:bg-surfaceHover hover:text-textPrimary hover:border-borderHover'
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Brain className="w-4 h-4" />
        <span className="truncate max-w-[100px]">{currentModel.label}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  )
}