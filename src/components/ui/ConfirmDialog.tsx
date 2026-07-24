import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  modalBackdropVariants,
  modalContentVariants,
} from '@/lib/transitions'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  children?: React.ReactNode
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  children,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
      setTimeout(() => contentRef.current?.focus(), 0)
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        ref={overlayRef}
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[99] flex items-center justify-center bg-black/50"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <motion.div
          ref={contentRef}
          tabIndex={-1}
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'w-full max-w-md mx-4 bg-background border border-border rounded-xl shadow-xl',
          )}
        >
          <div className="p-6">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-text">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-textSecondary">{description}</p>
            )}
            {children}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 pb-4 border-t border-border">
            <Button variant="ghost" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant}
              onClick={() => {
                onConfirm()
                onClose()
              }}
              autoFocus
            >
              {confirmLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}