'use client'

import { useLayoutEffect, useState, useCallback, useRef, useEffect } from 'react'

export interface UseDropdownPositionOptions {
  minWidth?: number
  margin?: number
  maxWidth?: number
}

export interface UseDropdownPositionReturn {
  portalPosition: { top: number; left: number } | null
  updatePosition: () => void
}

/**
 * Hook para calcular e manter a posição de um dropdown portalizado.
 * Recalcula automaticamente em resize, scroll e quando o trigger muda.
 */
export function useDropdownPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  options: UseDropdownPositionOptions = {}
): UseDropdownPositionReturn {
  const {
    minWidth = 200,
    margin = 8,
    maxWidth = 280,
  } = options

  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null)
  const updateScheduled = useRef(false)
  const rafId = useRef<number | null>(null)

  const calculatePosition = useCallback(() => {
    // Skip calculation if not open or no trigger
    if (!isOpen || !triggerRef.current) {
      return null
    }

    const trigger = triggerRef.current
    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Preferred position: below trigger, aligned left
    let top = rect.bottom + margin
    let left = rect.left

    // Check horizontal bounds
    const maxLeft = viewportWidth - minWidth - margin
    if (left > maxLeft) {
      left = Math.max(margin, maxLeft)
    }
    if (left < margin) {
      left = margin
    }

    // Check vertical bounds - if doesn't fit below, try above
    const estimatedHeight = maxWidth // rough estimate
    if (top + estimatedHeight > viewportHeight - margin) {
      // Try above the trigger
      const aboveTop = rect.top - margin - estimatedHeight
      if (aboveTop >= margin) {
        top = aboveTop
      }
    }

    return { top: Math.round(top), left: Math.round(left) }
  }, [isOpen, triggerRef, minWidth, margin, maxWidth])

  const updatePosition = useCallback(() => {
    if (!isOpen) {
      return
    }
    const position = calculatePosition()
    if (position) {
      setPortalPosition(position)
    }
  }, [calculatePosition, isOpen])

  // Initial calculation when opening
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    } else {
      setPortalPosition(null)
    }
  }, [isOpen, updatePosition])

  // Recalculate on window resize
  useEffect(() => {
    if (!isOpen) return

    let timeoutId: ReturnType<typeof setTimeout>

    const handleResize = () => {
      // Debounce resize events
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

  return { portalPosition, updatePosition }
}