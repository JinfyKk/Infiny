import { motion, useReducedMotion } from 'framer-motion'

const dotVariants = {
  initial: { opacity: 0.3, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0.3, scale: 0.8 }
} as const

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, repeat: Infinity, repeatType: 'reverse' as const }
  }
} as const

export function TypingIndicator() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-1 px-1 py-2"
      role="status"
      aria-label="Digitando..."
    >
      <motion.span
        variants={dotVariants}
        className="w-2 h-2 bg-textMuted rounded-full"
        aria-hidden="true"
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeInOut' }}
      />
      <motion.span
        variants={dotVariants}
        className="w-2 h-2 bg-textMuted rounded-full"
        aria-hidden="true"
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
      />
      <motion.span
        variants={dotVariants}
        className="w-2 h-2 bg-textMuted rounded-full"
        aria-hidden="true"
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeInOut', delay: 0.2 }}
      />
    </motion.div>
  )
}