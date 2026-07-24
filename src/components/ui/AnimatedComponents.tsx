import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ReactNode, forwardRef, InputHTMLAttributes, useState, useRef, ComponentPropsWithoutRef, useEffect, TextareaHTMLAttributes, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  fadeInUpVariants,
  scaleInVariants,
  scaleInSmallVariants,
  transitions,
  staggerContainerVariants,
  staggerContainerFastVariants,
  staggerContainerSlowVariants,
  staggerItemVariants,
  staggerItemSlideVariants,
  staggerItemScaleVariants,
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

/**
 * Input animado com foco suave - microinteração focus suave
 */
export interface AnimatedInputProps extends OmitDragProps<InputHTMLAttributes<HTMLInputElement>> {
  label?: string
  error?: string
  helperText?: string
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <motion.div className="w-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={transitions.smooth}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-textSecondary mb-1.5">
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg bg-surface border text-textPrimary placeholder-textMuted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error focus-visible:ring-error',
            !error && 'border-border hover:border-borderHover',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
          whileFocus={shouldReduceMotion ? undefined : { scale: 1.002, transition: transitions.snappy }}
        />
        {error && (
          <motion.p
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-sm text-error"
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <motion.p
            id={helperId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-sm text-textMuted"
          >
            {helperText}
          </motion.p>
        )}
      </motion.div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

/**
 * Textarea animado com foco suave e redimensionamento animado - microinteração focus suave
 */
export interface AnimatedTextareaProps extends OmitDragProps<TextareaHTMLAttributes<HTMLTextAreaElement>> {
  label?: string
  error?: string
  helperText?: string
  minRows?: number
  maxRows?: number
}

export const AnimatedTextarea = forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  ({ className, label, error, helperText, id, minRows = 3, maxRows = 10, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`
    const errorId = `${textareaId}-error`
    const helperId = `${textareaId}-helper`
    const [height, setHeight] = useState(48)

    const adjustHeight = useCallback((el: HTMLTextAreaElement | null) => {
      if (!el) return
      const lineHeight = 24 // approximate line height in px
      const minHeight = minRows * lineHeight
      const maxHeight = maxRows * lineHeight
      el.style.height = 'auto'
      const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)
      setHeight(newHeight)
      el.style.height = `${newHeight}px`
    }, [minRows, maxRows])

    useEffect(() => {
      if (ref && 'current' in ref) {
        adjustHeight(ref.current)
      }
    }, [adjustHeight, ref])

    return (
      <motion.div className="w-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={transitions.smooth}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-textSecondary mb-1.5">
            {label}
          </label>
        )}
        <motion.textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg bg-surface border text-textPrimary placeholder-textMuted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y min-h-[48px]',
            error && 'border-error focus-visible:ring-error',
            !error && 'border-border hover:border-borderHover',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          style={{ height: height }}
          onChange={(e) => {
            adjustHeight(e.currentTarget)
            props.onChange?.(e)
          }}
          onBlur={(e) => {
            adjustHeight(e.currentTarget)
            props.onBlur?.(e)
          }}
          {...props}
          whileFocus={shouldReduceMotion ? undefined : { scale: 1.002, transition: transitions.snappy }}
        />
        {error && (
          <motion.p
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-sm text-error"
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <motion.p
            id={helperId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-sm text-textMuted"
          >
            {helperText}
          </motion.p>
        )}
      </motion.div>
    )
  }
)

AnimatedTextarea.displayName = 'AnimatedTextarea'

/**
 * Container animado para entrada/saída suave
 */
interface AnimatedContainerProps extends OmitDragProps<ComponentPropsWithoutRef<'div'>> {
  children: ReactNode
  animation?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'scaleInSmall'
  delay?: number
  className?: string
  /** Mostrar/esconder com animação */
  isVisible?: boolean
}

const animationVariants = {
  fadeInUp: fadeInUpVariants,
  fadeInDown: {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0, transition: transitions.smooth },
    exit: { opacity: 0, y: 8, transition: transitions.tweenFast },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: transitions.smooth },
    exit: { opacity: 0, x: 8, transition: transitions.tweenFast },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 12 },
    visible: { opacity: 1, x: 0, transition: transitions.smooth },
    exit: { opacity: 0, x: -8, transition: transitions.tweenFast },
  },
  scaleIn: scaleInVariants,
  scaleInSmall: scaleInSmallVariants,
} as const

export function AnimatedContainer({
  children,
  animation = 'fadeInUp',
  delay = 0,
  className,
  isVisible = true,
  ...props
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion()
  const variants = animationVariants[animation]

  if (!isVisible) return null

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ transitionDelay: `${delay}s` } as any}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Container com stagger children
 */
interface StaggerContainerProps extends OmitDragProps<ComponentPropsWithoutRef<'div'>> {
  children: ReactNode
  speed?: 'fast' | 'normal' | 'slow'
  className?: string
}

const staggerContainerMap = {
  fast: staggerContainerFastVariants,
  normal: staggerContainerVariants,
  slow: staggerContainerSlowVariants,
} as const

export function StaggerContainer({ children, speed = 'normal', className, ...props }: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion()
  const variants = staggerContainerMap[speed]

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Item para stagger container
 */
interface StaggerItemProps extends OmitDragProps<ComponentPropsWithoutRef<'div'>> {
  children: ReactNode
  animation?: 'slide' | 'fade' | 'scale'
  className?: string
}

const staggerItemMap = {
  slide: staggerItemSlideVariants,
  fade: staggerItemVariants,
  scale: staggerItemScaleVariants,
} as const

export function StaggerItem({ children, animation = 'fade', className, ...props }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion()
  const variants = staggerItemMap[animation]

  return (
    <motion.div
      variants={variants}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Skeleton loader animado - shimmer suave
 */
export function Skeleton({ className, ...props }: OmitDragProps<ComponentPropsWithoutRef<'div'>>) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 1.1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
      }
      className={cn('bg-surfaceHover rounded', className)}
      style={{
        background: 'linear-gradient(90deg, var(--surface-hover) 25%, var(--surface-border) 50%, var(--surface-hover) 75%)',
        backgroundSize: '200% 100%',
      } as React.CSSProperties}
      {...props}
    />
  )
}

/**
 * Spinner animado - rotação suave e contínua
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 16, md: 24, lg: 32 }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const shouldReduceMotion = useReducedMotion()
  const diameter = sizeMap[size]

  const spinnerVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: transitions.snappy },
  }

  return (
    <motion.svg
      variants={spinnerVariants}
      initial="hidden"
      animate="visible"
      className={cn('text-primary', className)}
      width={diameter}
      height={diameter}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="65.97"
        strokeDashoffset="20"
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={shouldReduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </motion.svg>
  )
}

/**
 * Badge animado - entrada suave
 */
interface AnimatedBadgeProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
  animateIn?: boolean
}

const badgeVariants = {
  primary: 'bg-primarySoft text-primary',
  secondary: 'bg-surfaceHover text-textSecondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
}

export function AnimatedBadge({ children, variant = 'primary', className, animateIn = true }: AnimatedBadgeProps) {
  const shouldReduceMotion = useReducedMotion()

  if (!animateIn) {
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badgeVariants[variant], className)}>
        {children}
      </span>
    )
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9, y: 2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -2 }}
      transition={shouldReduceMotion ? { duration: 0 } : transitions.smooth}
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badgeVariants[variant], className)}
    >
      {children}
    </motion.span>
  )
}

/**
 * Tooltip animado - entrada suave com delay
 */
interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const shouldReduceMotion = useReducedMotion()

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary/90',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary/90',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary/90',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary/90',
  }

  return (
    <div className="relative inline-block" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 6 : -6 }}
            transition={shouldReduceMotion ? { duration: 0 } : transitions.snappy}
            className={cn('fixed z-50 pointer-events-none', positions[position])}
            style={{ transformOrigin: position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : 'center' } as React.CSSProperties}
          >
            <div className="bg-primary/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg backdrop-blur">
              {content}
            </div>
            <div className={cn('w-0 h-0 border-4 border-transparent', arrowPositions[position])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Ícone animado para expansão/contração - rotação suave
 */
interface AnimatedIconProps {
  isOpen: boolean
  rotateAmount?: number
  children: ReactNode
  className?: string
}

export function AnimatedIcon({ isOpen, rotateAmount = 90, children, className }: AnimatedIconProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.span
      animate={{ rotate: isOpen ? rotateAmount : 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : transitions.snappy}
      className={cn('inline-flex flex-shrink-0', className)}
    >
      {children}
    </motion.span>
  )
}

/**
 * Collapsible animado - altura suave
 */
interface CollapsibleProps {
  isOpen: boolean
  children: ReactNode
  className?: string
}

export function Collapsible({ isOpen, children, className }: CollapsibleProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0.85, y: -6 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          exit={{ opacity: 0, scaleY: 0.85, y: -6 }}
          transition={shouldReduceMotion ? { duration: 0 } : transitions.smooth}
          className={cn('overflow-hidden transform-origin-top', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Re-export necessary items
export { motion, AnimatePresence } from 'framer-motion'
export * from '@/lib/transitions'