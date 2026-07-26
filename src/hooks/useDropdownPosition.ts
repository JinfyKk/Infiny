'use client'

import { useLayoutEffect, useState, useCallback, useRef, useEffect } from 'react'
import {
  calculateDropdownPosition,
  DropdownPositionOptions,
  DropdownPositionResult,
} from '@/lib/dropdownPosition'

export interface UseDropdownPositionOptions extends DropdownPositionOptions {
  /** Se o dropdown está aberto */
  isOpen: boolean
}

export interface UseDropdownPositionReturn extends DropdownPositionResult {
  /** Referência do dropdown para medição real */
  dropdownRef: React.RefObject<HTMLDivElement | null>
  /** Função para forçar recálculo da posição */
  updatePosition: () => void
}

/**
 * Hook para calcular e manter a posição de um dropdown portalizado.
 * Usa calculateDropdownPosition que trata o viewport como bounding box físico,
 * fazendo clamp real das coordenadas e flip automático (top/bottom).
 *
 * Recalcula automaticamente em:
 * - Resize da janela
 * - Scroll da página
 * - Mudança de layout do trigger (via ResizeObserver)
 */
export function useDropdownPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  options: UseDropdownPositionOptions
): UseDropdownPositionReturn {
  const {
    isOpen,
    minWidth = 200,
    margin = 8,
    maxWidth = 280,
    preferBottom = true,
  } = options

  const dropdownRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<DropdownPositionResult>({
    left: margin,
    top: margin,
    placement: 'bottom',
    maxHeight: window.innerHeight - margin * 2,
    width: minWidth,
  })
  const updateScheduled = useRef(false)
  const rafId = useRef<number | null>(null)

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current) {
      return
    }

    const result = calculateDropdownPosition(triggerRef, dropdownRef, {
      margin,
      minWidth,
      maxWidth,
      preferBottom,
    })

    setPosition(result)
  }, [isOpen, triggerRef, margin, minWidth, maxWidth, preferBottom])

  // Initial calculation when opening
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  // Recalculate on window resize
  useEffect(() => {
    if (!isOpen) return

    let timeoutId: ReturnType<typeof setTimeout>

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updatePosition()
      }, 50)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isOpen, updatePosition])

  // Recalculate on trigger layout change (using ResizeObserver)
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const trigger = triggerRef.current
    const observer = new ResizeObserver(() => {
      if (!updateScheduled.current) {
        updateScheduled.current = true
        rafId.current = requestAnimationFrame(() => {
          updateScheduled.current = false
          updatePosition()
        })
      }
    })

    observer.observe(trigger)

    return () => {
      observer.disconnect()
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [isOpen, triggerRef, updatePosition])

  return {
    ...position,
    dropdownRef,
    updatePosition,
  }
}