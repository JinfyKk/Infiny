import React, { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  interactiveButtonVariants,
  interactiveIconButtonVariants,
  interactiveIconRotateVariants,
} from '@/lib/transitions'

// Type helper to omit motion-specific props that conflict with native HTML
type OmitDragProps<T> = Omit<T,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDrop'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onTransitionStart'
  | 'onTransitionEnd'
  | 'onTransitionCancel'
>

export interface ButtonProps extends OmitDragProps<React.ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  children: React.ReactNode
  /** Tipo de animação de interação */
  interactionType?: 'scale' | 'icon-rotate' | 'icon-pulse'
  /** Desabilita animações de hover/tap para performance */
  disableAnimations?: boolean
}

const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed'

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
  secondary: 'bg-surfaceHover text-textPrimary hover:bg-borderHover active:bg-border',
  ghost: 'bg-transparent text-textSecondary hover:bg-surfaceHover hover:text-textPrimary active:bg-border',
  danger: 'bg-error/10 text-error hover:bg-error/20 active:bg-error/30',
  subtle: 'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30',
  outline: 'bg-transparent text-primary hover:bg-primary/5 active:bg-primary/10 border border-primary',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  icon: 'h-10 w-10 p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      children,
      disabled,
      interactionType = 'scale',
      disableAnimations = false,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion()

    // Seleciona as variantes baseadas no tipo de interação
    const variants =
      interactionType === 'icon-rotate'
        ? interactiveIconRotateVariants
        : interactionType === 'icon-pulse'
          ? interactiveIconButtonVariants
          : interactiveButtonVariants

    const transition = shouldReduceMotion || disableAnimations
      ? { duration: 0 }
      : undefined

    const sharedProps = {
      ref,
      className: cn(baseStyles, variantStyles[variant], sizeStyles[size], className),
      disabled: disabled || isLoading,
      ...props,
    } as const

    if (disableAnimations) {
      return (
        <button {...sharedProps}>
          {isLoading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {!isLoading && children}
        </button>
      )
    }

    return (
      <motion.button
        {...sharedProps}
        variants={variants}
        initial="initial"
        whileHover={disabled || isLoading ? 'disabled' : 'hover'}
        whileTap={disabled || isLoading ? 'disabled' : 'tap'}
        animate={disabled || isLoading ? 'disabled' : 'initial'}
        transition={transition}
      >
        {isLoading && (
          <motion.svg
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-4 w-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </motion.svg>
        )}
        {!isLoading && children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

/**
 * Button usado como ícone apenas (sem texto)
 */
export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'children'> {
  children: React.ReactNode
  'aria-label': string
  title?: string
}

export function IconButton({
  variant = 'ghost',
  interactionType = 'icon-pulse',
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size="icon"
      interactionType={interactionType}
      className={cn('p-0', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * Botão de ação perigosa (destrutivo)
 */
export interface DangerButtonProps extends ButtonProps {
  confirmText?: string
  onConfirm?: () => void
}

export function DangerButton({
  confirmText = 'Confirmar',
  onConfirm,
  variant = 'danger',
  ...props
}: DangerButtonProps) {
  const [showConfirm, setShowConfirm] = React.useState(false)

  const handleClick = () => {
    if (onConfirm) {
      setShowConfirm(true)
    }
  }

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <Button variant={variant} size="sm" onClick={onConfirm}>
          {confirmText}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return <Button variant={variant} onClick={handleClick} {...props} />
}

export default Button