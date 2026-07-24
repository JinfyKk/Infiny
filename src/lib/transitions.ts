import { Variants, Transition } from 'framer-motion';

/**
 * Sistema de animações premium para o Infiny - Personalidade Turtly
 *
 * Princípios da Turtly (calma, estabilidade, persistência, confiança):
 * - Suaves e elegantes, não chamativas
 * - Naturais, com física de mola sutil (sem overshoot excessivo)
 * - Discretas, transmitem qualidade e precisão
 * - Rápidas o suficiente para não atrapalhar (150-300ms)
 * - Respeitam prefers-reduced-motion
 * - GPU-accelerated properties apenas (transform, opacity, scale)
 */

// ============================================================================
// TRANSITIONS BASE (Framer Motion) - Alinhadas com design-system/tokens.ts
// ============================================================================

/**
 * Mola suave e natural - ideal para entrada/saída de elementos
 * stiffness: 280, damping: 22 -> movimento calmo, sem bounce excessivo
 */
export const smooth: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 22,
  mass: 1,
} as const;

/**
 * Mola responsiva - ideal para hover/tap/feedback imediato
 * stiffness: 350, damping: 25 -> rápido mas controlado
 */
export const snappy: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 25,
  mass: 0.9,
} as const;

/**
 * Mola para modais/painéis - mais rígida para estabilidade
 * stiffness: 400, damping: 28 -> entradas firmes
 */
export const stiff: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
  mass: 1.1,
} as const;

/**
 * Mola com leve bounce - ideal para feedback de sucesso/celebração
 * stiffness: 380, damping: 18 -> sutil, sem overshoot exagerado
 */
export const bouncy: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 18,
  mass: 0.9,
} as const;

/**
 * Tween suave (sem física de mola) - para propriedades que não precisam de spring
 * duration: 200ms, easing padrão Material/iOS
 */
export const tween: Transition = {
  type: 'tween',
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const;

/**
 * Tween rápido - micro-interações
 */
export const tweenFast: Transition = {
  type: 'tween',
  duration: 0.12,
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const;

/**
 * Tween lento - transições de página/painel
 */
export const tweenSlow: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const;

/**
 * Transições consolidadas para uso direto
 */
export const transitions = {
  /** Suave e natural - 200ms equivalent */
  smooth,
  /** Rápido e responsivo - 150ms equivalent */
  snappy,
  /** Rígido para modais/painéis - 250ms equivalent */
  stiff,
  /** Com leve bounce - feedback de sucesso/celebração */
  bouncy,
  /** Tween suave */
  tween,
  /** Tween rápido */
  tweenFast,
  /** Tween lento */
  tweenSlow,
} as const;

// ============================================================================
// VARIANTES DE ENTRADA/SAÍDA REUTILIZÁVEIS
// ============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: smooth },
  exit: { opacity: 0, transition: tweenFast },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: -8, transition: tweenFast },
};

export const fadeInDownVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: 8, transition: tweenFast },
};

export const fadeInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: smooth },
  exit: { opacity: 0, x: 8, transition: tweenFast },
};

export const fadeInRightVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: smooth },
  exit: { opacity: 0, x: -8, transition: tweenFast },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: smooth },
  exit: { opacity: 0, scale: 0.93, transition: tweenFast },
};

export const scaleInSmallVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: snappy },
  exit: { opacity: 0, scale: 0.85, transition: tweenFast },
};

export const slideInFromRightVariants: Variants = {
  hidden: { opacity: 0, x: 280 },
  visible: { opacity: 1, x: 0, transition: stiff },
  exit: { opacity: 0, x: 280, transition: tween },
};

export const slideInFromLeftVariants: Variants = {
  hidden: { opacity: 0, x: -280 },
  visible: { opacity: 1, x: 0, transition: stiff },
  exit: { opacity: 0, x: -280, transition: tween },
};

export const slideInFromTopVariants: Variants = {
  hidden: { opacity: 0, y: -80 },
  visible: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: -80, transition: tweenFast },
};

export const slideInFromBottomVariants: Variants = {
  hidden: { opacity: 0, y: 80 },
  visible: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: 80, transition: tweenFast },
};

/**
 * Variantes para overlays/backdrops
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tween },
  exit: { opacity: 0, transition: tweenFast },
};

/**
 * Container com stagger children
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.012,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFastVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.015,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.008,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerSlowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.015,
      staggerDirection: -1,
    },
  },
};

/**
 * Variantes para itens individuais em stagger
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: smooth },
  exit: { opacity: 0, y: -6, transition: tweenFast },
};

export const staggerItemSlideVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: smooth },
  exit: { opacity: 0, x: 6, transition: tweenFast },
};

export const staggerItemScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: snappy },
  exit: { opacity: 0, scale: 0.92, transition: tweenFast },
};

/**
 * Variantes para botões interativos
 */
export const interactiveButtonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.015, transition: snappy },
  tap: { scale: 0.985, transition: tweenFast },
  disabled: { opacity: 0.5, scale: 1 },
};

export const interactiveIconButtonVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.08, transition: snappy },
  tap: { scale: 0.92, transition: tweenFast },
};

export const interactiveIconRotateVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.08, rotate: 90, transition: snappy },
  tap: { scale: 0.92, rotate: 90, transition: tweenFast },
};

/**
 * Variantes para itens de lista/menu
 */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.85, y: -8 },
  visible: {
    opacity: 1,
    scaleY: 1,
    y: 0,
    transition: smooth,
  },
  exit: {
    opacity: 0,
    scaleY: 0.85,
    y: -8,
    transition: tweenFast,
  },
};

export const listItemSlideVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: smooth },
  exit: { opacity: 0, x: 8, transition: tweenFast },
};

/**
 * Variantes para dropdowns/popovers
 */
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: smooth },
  exit: { opacity: 0, scale: 0.96, y: -6, transition: tweenFast },
};

export const dropdownItemVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: snappy },
  exit: { opacity: 0, x: 6, transition: tweenFast },
};

/**
 * Variantes para modais/dialogs
 */
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tween },
  exit: { opacity: 0, transition: tweenFast },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: smooth },
  exit: { opacity: 0, scale: 0.96, y: 16, transition: tweenFast },
};

export const modalContentLargeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: stiff },
  exit: { opacity: 0, scale: 0.93, y: 24, transition: tween },
};

/**
 * Variantes para notificações/toasts
 */
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 280, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: snappy },
  exit: { opacity: 0, x: 280, scale: 0.96, transition: tweenFast },
};

export const toastIconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { ...snappy, delay: 0.08 } },
};

/**
 * Variantes para indicador de digitação
 */
export const typingIndicatorContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, repeat: Infinity, repeatType: 'reverse' },
  },
};

export const typingIndicatorDotVariants: Variants = {
  hidden: { opacity: 0.35, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: 'easeInOut' } },
};

/**
 * Variantes para mensagens de chat
 */
export const chatMessageVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.85, y: 12 },
  visible: { opacity: 1, scaleY: 1, y: 0, transition: smooth },
  exit: { opacity: 0, scaleY: 0.85, y: -8, transition: tweenFast },
};

export const chatMessageStreamingVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: smooth },
};

/**
 * Variantes para painéis laterais
 */
export const sidebarVariants: Variants = {
  closed: { x: -280, opacity: 0 },
  open: { x: 0, opacity: 1, transition: stiff },
};

export const filesPanelVariants: Variants = {
  closed: { x: 280, opacity: 0 },
  open: { x: 0, opacity: 1, transition: stiff },
};

/**
 * Variantes para abas com indicação animada
 */
export const tabIndicatorVariants: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: { opacity: 1, scaleX: 1, transition: smooth },
};

/**
 * Variantes para busca/command palette
 */
export const commandPaletteVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: smooth },
  exit: { opacity: 0, scale: 0.96, y: -16, transition: tweenFast },
};

export const commandPaletteItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: snappy },
};

/**
 * Variantes para árvore de arquivos
 */
export const fileTreeItemVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.85, y: -6 },
  visible: {
    opacity: 1,
    scaleY: 1,
    y: 0,
    transition: { staggerChildren: 0.012 },
  },
  exit: {
    opacity: 0,
    scaleY: 0.85,
    y: -6,
    transition: { staggerChildren: 0.008, staggerDirection: -1 },
  },
};

export const fileTreeChildVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: snappy },
};

/**
 * Variantes para loading states
 */
export const skeletonVariants: Variants = {
  hidden: { opacity: 0.4 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.1,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

export const spinnerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: snappy },
  animate: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: 'linear' } },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Cria transição respeitando prefers-reduced-motion
 */
export function getTransition(transition: Transition, shouldReduceMotion: boolean): Transition {
  if (shouldReduceMotion) {
    return { duration: 0, delay: 0 };
  }
  return transition;
}

/**
 * Cria variantes condicionais baseadas em reduced motion
 */
export function createReducedMotionVariants<T extends Variants>(
  variants: T,
  shouldReduceMotion: boolean
): T {
  if (!shouldReduceMotion) return variants;

  const reduced: Record<string, any> = {};
  for (const [key, value] of Object.entries(variants)) {
    if (typeof value === 'object' && value !== null && 'transition' in value) {
      reduced[key] = { ...value, transition: { duration: 0, delay: 0 } };
    } else {
      reduced[key] = value;
    }
  }
  return reduced as T;
}

/**
 * Easings personalizados para sensação premium (calmo, natural)
 */
export const easings = {
  /** Easing padrão Material Design / iOS */
  standard: [0.25, 0.1, 0.25, 1] as const,
  /** Aceleração suave */
  easeOut: [0.25, 0.1, 0.25, 1] as const,
  /** Desaceleração suave */
  easeIn: [0.4, 0, 1, 1] as const,
  /** Spring-like easing para tween */
  spring: [0.34, 1.2, 0.64, 1] as const,
  /** Entrada nítida */
  sharp: [0.4, 0, 0.2, 1] as const,
  /** Suave entrada/saída */
  smooth: [0.25, 0.1, 0.25, 1] as const,
} as const;

/**
 * Suffix usado para edição de projeto para evitar conflitos com chat IDs
 */
export const PROJECT_EDIT_SUFFIX = '__edit';

/**
 * Durações padronizadas (em segundos)
 */
export const durations = {
  instant: 0,
  fast: 0.12,
  normal: 0.2,
  slow: 0.28,
  slower: 0.35,
} as const;

/**
 * Delays para stagger
 */
export const staggerDelays = {
  tight: 0.015,
  normal: 0.025,
  loose: 0.04,
  section: 0.08,
} as const;

/**
 * Spring transitions consolidadas para uso direto
 */
export const springTransition = {
  /** Suave e natural */
  gentle: smooth,
  /** Rápido e responsivo */
  snappy,
  /** Rígido para modais/painéis */
  stiff,
  /** Tween suave */
  smooth: tween,
  /** Tween rápido */
  fast: tweenFast,
  /** Tween lento */
  slow: tweenSlow,
} as const;