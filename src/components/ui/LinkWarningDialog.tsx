import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import turtlyImg from '@/assets/Gemini_Generated_Image_xev09dxev09dxev0-removebg-preview.png'

/**
 * Nome do evento global disparado quando o usuário clica em um link
 * externo (http/https) dentro de uma mensagem do chat. O `Message.tsx`
 * dispara esse evento em vez de navegar direto; este componente escuta
 * e mostra o aviso de confirmação.
 */
export const EXTERNAL_LINK_EVENT = 'infiny:external-link-click'

export function LinkWarningDialog() {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string }>).detail
      if (detail?.url) {
        setPendingUrl(detail.url)
      }
    }
    window.addEventListener(EXTERNAL_LINK_EVENT, handler as EventListener)
    return () => window.removeEventListener(EXTERNAL_LINK_EVENT, handler as EventListener)
  }, [])

  const handleClose = () => setPendingUrl(null)

  const handleConfirm = async () => {
    if (!pendingUrl) return
    try {
      const result = await window.electronAPI?.openExternal(pendingUrl)
      if (result && !result.success) {
        console.warn('[LinkWarningDialog] Falha ao abrir o link:', result.error)
      }
    } catch (err) {
      console.warn('[LinkWarningDialog] Erro ao abrir o link:', err)
    }
  }

  return (
    <ConfirmDialog
      isOpen={!!pendingUrl}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Você será redirecionado"
      confirmLabel="Ir"
      cancelLabel="Não ir"
      variant="primary"
    >
      <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-surfaceHover">
        <img
          src={turtlyImg}
          alt="Turtly"
          className="w-9 h-9 object-contain flex-shrink-0 mt-0.5"
        />
        <p className="text-sm text-textSecondary break-all">
          Você vai sair do Infiny e abrir este link no seu navegador:
          <br />
          <span className="text-text font-medium">{pendingUrl}</span>
        </p>
      </div>
    </ConfirmDialog>
  )
}