'use client'

import { Gauge, Battery, Cpu, Zap, Activity } from 'lucide-react'
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown'

type EffortValue = 'low' | 'medium' | 'high' | 'max' | 'xhigh'

const EFFORTS: DropdownOption[] = [
  { value: 'low', label: 'Low', description: 'Respostas rápidas, menos tokens', icon: <Battery className="w-4 h-4" /> },
  { value: 'medium', label: 'Medium', description: 'Equilibrado', icon: <Gauge className="w-4 h-4" /> },
  { value: 'high', label: 'High', description: 'Mais detalhado e completo', icon: <Cpu className="w-4 h-4" /> },
  { value: 'max', label: 'Max', description: 'Máximo esforço', icon: <Zap className="w-4 h-4" /> },
  { value: 'xhigh', label: 'XHigh', description: 'Ultra detalhado', icon: <Activity className="w-4 h-4" /> },
]

interface EffortSelectorProps {
  effort: EffortValue
  onChange: (effort: EffortValue) => void
}

export function EffortSelector({ effort, onChange }: EffortSelectorProps) {
  const currentEffort = EFFORTS.find((e) => e.value === effort) || EFFORTS[1]

  return (
    <Dropdown
      value={effort}
      onChange={(value) => onChange(value as EffortValue)}
      options={EFFORTS}
      triggerLabel={currentEffort.label}
      triggerIcon={<Gauge className="w-4 h-4" />}
      placeholder="Effort"
      minWidth={180}
      ariaLabel={`Nível de esforço atual: ${currentEffort.label}`}
    />
  )
}

export default EffortSelector