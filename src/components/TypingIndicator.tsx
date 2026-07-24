import { motion, useReducedMotion } from 'framer-motion'
import {
  typingIndicatorContainerVariants,
  typingIndicatorDotVariants,
  transitions,
} from '@/lib/transitions'

export function TypingIndicator() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={typingIndicatorContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-1 px-1 py-2"
      role="status"
      aria-label="Digitando..."
    >
      <motion.span
        variants={typingIndicatorDotVariants}
        className="w-2 h-2 bg-primary rounded-full"
        aria-hidden="true"
        transition={shouldReduceMotion ? { duration: 0 } : transitions.smooth}
      />
      <motion.span
        variants={typingIndicatorDotVariants}
        className="w-2 h-2 bg-primary rounded-full"
        aria-hidden="true"
        transition={shouldReduceMotion ? { duration: 0 } : { ...transitions.smooth, delay: 0.1 }}
      />
      <motion.span
        variants={typingIndicatorDotVariants}
        className="w-2 h-2 bg-primary rounded-full"
        aria-hidden="true"
        transition={shouldReduceMotion ? { duration: 0 } : { ...transitions.smooth, delay: 0.2 }}
      />
    </motion.div>
  )
}