import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Gauge, Zap, Battery, Cpu, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EffortOption {
  value: 'low' | 'medium' | 'high' | 'max' | 'xhigh'
  label: string
  description: string
  icon: React.ReactNode
}

const EFFORTS: EffortOption[] = [
  { value: 'low', label: 'Low', description: 'Respostas rápidas, menos tokens', icon: <Battery className="w-4 h-4" /> },
  { value: 'medium', label: 'Medium', description: 'Equilibrado', icon: <Gauge className="w-4 h-4" /> },
  { value: 'high', label: 'High', description: 'Mais detalhado e completo', icon: <Cpu className="w-4 h-4" /> },
  { value: 'max', label: 'Max', description: 'Máximo esforço', icon: <Zap className="w-4 h-4" /> },
  { value: 'xhigh', label: 'XHigh', description: 'Ultra detalhado', icon: <Activity className="w-4 h-4" /> },
]

interface EffortSelectorProps {
  effort: 'low' | 'medium' | 'high' | 'max' | 'xhigh'
  onChange: (effort: 'low' | 'medium' | 'high' | 'max' | 'xhigh') => void
  isOpen: boolean
  onToggle: () => void
}

export function EffortSelector({ effort, onChange, isOpen, onToggle }: EffortSelectorProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(EFFORTS.findIndex(e => e.value === effort))

  useEffect(() => {
    setSelectedIndex(EFFORTS.findIndex(e => e.value === effort))
  }, [effort])

  const currentEffort = EFFORTS.find(e => e.value === effort) || EFFORTS[1]

  const menuContent = (
    <div className="fixed z-50 mt-1.5 min-w-[180px] animate-in fade-in-150 zoom-in-95 duration-150">
      <div className="glass rounded-xl border border-glassBorder shadow-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-glassBorder bg-surface/50">
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Effort</span>
        </div>
        <div className="py-1" role="menu">
          {EFFORTS.map((e, idx) => (
            <button
              key={e.value}
              role="menuitem"
              onClick={() => { onChange(e.value as any); onToggle() }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                'w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors duration-100',
                'hover:bg-surfaceHover',
                idx === selectedIndex && 'bg-primary/10 text-primary',
                effort === e.value && 'font-medium'
              )}
            >
              <span className={cn('w-4 h-4 flex-shrink-0', effort === e.value ? 'text-primary' : 'text-textMuted')}>{e.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-medium capitalize">{e.label}</span>
                <span className="block text-xs truncate text-textMuted">{e.description}</span>
              </div>
              {effort === e.value && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
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
        <Gauge className="w-4 h-4" />
        <span className="truncate max-w-[80px] capitalize">{currentEffort.label}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  )
}