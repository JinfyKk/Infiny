import { useEffect } from 'react'
import { useStore } from '@/store/infinyStore'

interface ShortcutHandler {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  preventDefault?: boolean
  ignoreInputs?: boolean // se true, executa mesmo dentro de inputs/textarea
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true
        const metaMatch = shortcut.meta ? event.metaKey : true
        const shiftMatch = shortcut.shift ? event.shiftKey : true
        const altMatch = shortcut.alt ? event.altKey : true
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          // Se ignoreInputs é true, executa mesmo em inputs; se false (padrão), não executa em inputs
          const shouldExecute = shortcut.ignoreInputs === true || !isInput
          if (shouldExecute) {
            if (shortcut.preventDefault !== false) {
              event.preventDefault()
            }
            shortcut.handler()
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export function useSidebarShortcut() {
  const { toggleSidebar } = useStore()

  useKeyboardShortcuts([
    {
      key: 'b',
      ctrl: true,
      handler: toggleSidebar,
      ignoreInputs: true,
    },
  ])
}