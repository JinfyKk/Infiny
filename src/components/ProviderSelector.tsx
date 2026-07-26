'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown'
import { Brain, Terminal, Globe, Sparkles } from 'lucide-react'
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

  const chatId = currentChat?.id
  const isGenerating = chatId ? isChatGenerating(chatId) : false

  // O Dropdown component já usa useDropdownPosition internamente
  // Não precisamos de portalPosition, getBoundingClientRect, etc. aqui

  const currentProvider = settings.provider as ProviderValue
  const currentProviderOption = PROVIDERS.find((p) => p.value === currentProvider) || PROVIDERS[0]

  const handleSelect = useCallback(
    async (providerValue: string) => {
      updateSettings({ provider: providerValue as ProviderValue })
      // Notify main process to switch active provider
      try {
        await window.electronAPI?.setActiveProvider(providerValue as ProviderValue)
      } catch (error) {
        console.error('[ProviderSelector] Failed to set active provider:', error)
      }
    },
    [updateSettings]
  )

  return (
    <Dropdown
      value={currentProvider}
      onChange={handleSelect}
      options={PROVIDERS}
      triggerLabel={currentProviderOption.label}
      triggerIcon={
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {currentProviderOption.icon}
        </span>
      }
      placeholder="Provedor"
      disabled={isGenerating}
      ariaLabel={`Provedor atual: ${providerLabels[currentProvider]}`}
      minWidth={200}
    />
  )
}

export default ProviderSelector