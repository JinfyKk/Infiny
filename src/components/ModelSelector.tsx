'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown'
import { Brain } from 'lucide-react'

interface ModelOption extends DropdownOption {
  provider?: string
}

export function ModelSelector({
  model,
  onChange,
  availableModels,
  fetchModels,
}: {
  model: string
  onChange: (model: string) => void
  availableModels?: ModelOption[]
  fetchModels?: () => Promise<ModelOption[]>
}) {
  const [models, setModels] = useState<ModelOption[]>(availableModels || [])
  const [isLoading, setIsLoading] = useState(false)

  const DEFAULT_FALLBACK: ModelOption = {
    value: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    description: 'Equilibrado',
    icon: <Brain className="w-4 h-4" />,
  }

  const currentModel = models.find((m) => m.value === model) || models[0] || DEFAULT_FALLBACK

  const loadModels = useCallback(async () => {
    if (!fetchModels) return
    setIsLoading(true)
    try {
      const loaded = await fetchModels()
      if (loaded.length > 0) {
        setModels(loaded)
      }
    } catch (err) {
      console.error('[ModelSelector] Erro ao carregar modelos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchModels])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  useEffect(() => {
    if (availableModels) {
      setModels(availableModels)
    }
  }, [availableModels])

  const displayModels = models.length > 0 ? models : [DEFAULT_FALLBACK]

  return (
    <Dropdown
      value={model}
      onChange={onChange}
      options={displayModels}
      triggerLabel={currentModel.label}
      triggerIcon={<Brain className="w-4 h-4" />}
      placeholder={isLoading ? 'Carregando modelos...' : 'Modelos'}
      disabled={isLoading}
      ariaLabel={`Modelo atual: ${currentModel.label}`}
      minWidth={220}
    />
  )
}

export default ModelSelector