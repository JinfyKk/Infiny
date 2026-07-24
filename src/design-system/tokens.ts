/**
 * Infiny Design System Tokens
 * Single source of truth for all visual design decisions
 */

// ============================================================================
// SPACING SCALE (4px base unit)
// ============================================================================
export const spacing = {
  0: '0',
  1: '0.125rem',  // 2px
  2: '0.25rem',   // 4px
  3: '0.375rem',  // 6px
  4: '0.5rem',    // 8px
  5: '0.625rem',  // 10px
  6: '0.75rem',   // 12px
  7: '0.875rem',  // 14px
  8: '1rem',      // 16px
  9: '1.125rem',  // 18px
  10: '1.25rem',  // 20px
  11: '1.375rem', // 22px
  12: '1.5rem',   // 24px
  14: '1.75rem',  // 28px
  16: '2rem',     // 32px
  20: '2.5rem',   // 40px
  24: '3rem',     // 48px
  28: '3.5rem',   // 56px
  32: '4rem',     // 64px
} as const;

// Semantic spacing aliases
export const space = {
  none: spacing[0],
  xs: spacing[1],
  sm: spacing[2],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
  '2xl': spacing[10],
  '3xl': spacing[12],
  '4xl': spacing[16],
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================
export const fontFamily = {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),
  display: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
} as const;

export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1.375rem', letterSpacing: '-0.01em' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '-0.01em' }],     // 14px
  base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],          // 16px
  md: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],            // 16px (alias for base)
  lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],       // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],        // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],         // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],    // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],      // 36px
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// Semantic typography tokens
export const typography = {
  display: {
    lg: fontSize['4xl'],
    md: fontSize['3xl'],
    sm: fontSize['2xl'],
  },
  heading: {
    xl: fontSize['3xl'],
    lg: fontSize['2xl'],
    md: fontSize.xl,
    sm: fontSize.lg,
    xs: fontSize.md,
  },
  body: {
    lg: fontSize.lg,
    md: fontSize.base,
    sm: fontSize.sm,
    xs: fontSize.xs,
  },
  label: {
    lg: fontSize.base,
    md: fontSize.sm,
    sm: fontSize.xs,
  },
  code: {
    lg: ['1rem', { lineHeight: '1.5', fontFamily: fontFamily.mono }],
    md: ['0.875rem', { lineHeight: '1.5', fontFamily: fontFamily.mono }],
    sm: ['0.8125rem', { lineHeight: '1.5', fontFamily: fontFamily.mono }],
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOW SCALE (elevation-based)
// ============================================================================
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Colored shadows for primary actions
  'primary-sm': '0 1px 3px 0 rgb(var(--primary-rgb) / 0.3)',
  'primary-md': '0 4px 14px 0 rgb(var(--primary-rgb) / 0.35)',
  'primary-lg': '0 10px 25px -3px rgb(var(--primary-rgb) / 0.4)',
} as const;

// ============================================================================
// TRANSITIONS (CSS - para uso direto em Tailwind/styles)
// Alinhados com motion tokens acima
// ============================================================================
export const transition = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '150ms',
    slow: '200ms',
    slower: '300ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    spring: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  },
} as const;

// Common transition combinations
export const transitions = {
  fast: `${transition.duration.fast} ${transition.easing.easeOut}`,
  normal: `${transition.duration.normal} ${transition.easing.easeOut}`,
  slow: `${transition.duration.slow} ${transition.easing.easeOut}`,
  slower: `${transition.duration.slower} ${transition.easing.easeOut}`,
  spring: `${transition.duration.slow} ${transition.easing.spring}`,
  colors: `color ${transition.duration.fast} ${transition.easing.easeOut}, background-color ${transition.duration.fast} ${transition.easing.easeOut}, border-color ${transition.duration.fast} ${transition.easing.easeOut}`,
  transform: `transform ${transition.duration.normal} ${transition.easing.easeOut}`,
  all: `all ${transition.duration.normal} ${transition.easing.easeOut}`,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// OPACITY SCALE
// ============================================================================
export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  80: '0.8',
  90: '0.9',
  100: '1',
} as const;

// ============================================================================
// LAYOUT SIZES
// ============================================================================
export const sizes = {
  sidebar: {
    collapsed: '64px',
    compact: '240px',
    default: '288px',
    expanded: '352px',
  },
  header: {
    height: '48px',
    compact: '40px',
  },
  panel: {
    narrow: '280px',
    default: '320px',
    wide: '400px',
  },
  chat: {
    maxWidth: '768px',
    messageMaxWidth: '85%',
  },
  modal: {
    sm: '360px',
    md: '448px',
    lg: '560px',
    xl: '672px',
    full: '90vw',
  },
} as const;

// ============================================================================
// GLASS EFFECT OPACITY
// ============================================================================
export const glass = {
  light: 'rgba(255 255 255 / 0.7)',
  medium: 'rgba(255 255 255 / 0.85)',
  heavy: 'rgba(255 255 255 / 0.95)',
  dark: 'rgba(0 0 0 / 0.7)',
  'dark-medium': 'rgba(0 0 0 / 0.85)',
  'dark-heavy': 'rgba(0 0 0 / 0.95)',
  border: {
    light: 'rgba(0 0 0 / 0.08)',
    dark: 'rgba(255 255 255 / 0.12)',
  },
  blur: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },
} as const;

// ============================================================================
// FOCUS RING
// ============================================================================
export const focusRing = {
  width: '2px',
  offset: '2px',
  color: 'var(--focus-ring)',
} as const;

// ============================================================================
// MOTION TOKENS (Turtly Personality: Calm, Stable, Persistent, Trustworthy)
// ============================================================================
// Princípios:
// - Suaves, elegantes, naturais, discretas
// - Evitar: bounce exagerado, overshoot excessivo, animações chamativas
// - Preferir: transições suaves, spring physics natural, durações 150-300ms

export const motion = {
  /**
   * Spring configurations - todos calibrados para personalidade Turtly
   */
  spring: {
    /** Ultra-suave para entrada/saída de elementos sutis */
    gentle: { type: 'spring', stiffness: 120, damping: 16, mass: 1 } as const,
    /** Padrão para a maioria das transições - natural, estável */
    smooth: { type: 'spring', stiffness: 280, damping: 28, mass: 1 } as const,
    /** Responsiva para hover/tap - rápido mas sem overshoot */
    snappy: { type: 'spring', stiffness: 350, damping: 30, mass: 0.9 } as const,
    /** Rígida para modais/painéis - controle, sem oscilação */
    stiff: { type: 'spring', stiffness: 400, damping: 35, mass: 1.2 } as const,
  },

  /**
   * Durações padronizadas (em segundos) - 150ms a 300ms
   */
  duration: {
    instant: 0,
    fast: 0.1,      // 100ms - micro-interações
    normal: 0.15,   // 150ms - transições padrão
    slow: 0.2,      // 200ms - entrada/saída
    slower: 0.3,    // 300ms - modais, painéis
  } as const,

  /**
   * Easings padronizados - todos naturais, sem bounce
   */
  easing: {
    /** Padrão Material/iOS - entrada/saída suave */
    standard: [0.25, 0.1, 0.25, 1] as const,
    /** Desaceleração suave - para entrada */
    easeOut: [0, 0, 0.2, 1] as const,
    /** Aceleração suave - para saída */
    easeIn: [0.4, 0, 1, 1] as const,
    /** Spring-like para tween - sensação física */
    spring: [0.34, 1.2, 0.64, 1] as const,
    /** Entrada nítida - para elementos que devem chamar atenção sutil */
    sharp: [0.4, 0, 0.2, 1] as const,
  } as const,

  /**
   * Delay stagger padronizado
   */
  stagger: {
    tight: 0.02,    // 20ms - listas densas
    normal: 0.03,   // 30ms - padrão
    loose: 0.05,    // 50ms - seções
    section: 0.1,   // 100ms - grupos maiores
  } as const,
} as const;

/**
 * Transições compostas reutilizáveis (Framer Motion) - evitam hardcoded values
 * Renomeado para motionTransitions para não conflitar com transitions (CSS strings)
 */
export const motionTransitions = {
  /** Micro-interação instantânea */
  instant: { duration: motion.duration.instant, ease: motion.easing.standard },
  /** Rápida - hover, focus, tap */
  fast: { duration: motion.duration.fast, ease: motion.easing.easeOut },
  /** Normal - transições padrão */
  normal: { duration: motion.duration.normal, ease: motion.easing.standard },
  /** Lenta - entrada/saída de elementos */
  slow: { duration: motion.duration.slow, ease: motion.easing.easeOut },
  /** Mais lenta - modais, painéis */
  slower: { duration: motion.duration.slower, ease: motion.easing.easeOut },

  /** Spring suave - padrão para entrada/saída */
  smooth: motion.spring.smooth,
  /** Spring rápida - feedback imediato */
  snappy: motion.spring.snappy,
  /** Spring rígida - modais, dropdowns */
  stiff: motion.spring.stiff,
  /** Spring gentil - elementos sutis */
  gentle: motion.spring.gentle,

  /** Tween rápido */
  tweenFast: { type: 'tween', duration: motion.duration.fast, ease: motion.easing.standard },
  /** Tween normal */
  tween: { type: 'tween', duration: motion.duration.normal, ease: motion.easing.standard },
  /** Tween lento */
  tweenSlow: { type: 'tween', duration: motion.duration.slow, ease: motion.easing.standard },
} as const;

// Common animation variants
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: motion.duration.normal } },
    exit: { opacity: 0, transition: { duration: motion.duration.fast } },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -8, transition: { duration: motion.duration.fast } },
  },
  slideDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: 8, transition: { duration: motion.duration.fast } },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, x: 20, transition: { duration: motion.duration.fast } },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, x: -20, transition: { duration: motion.duration.fast } },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: motion.duration.fast } },
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.05 } },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  },
} as const;

// ============================================================================
// SEMANTIC COLOR MAPPINGS (These map to CSS variables)
// ============================================================================
export const semanticColors = {
  // Background layers
  bg: {
    primary: 'var(--bg)',
    elevated: 'var(--bg-elevated)',
    overlay: 'var(--bg-overlay)',
  },
  // Text layers
  text: {
    primary: 'var(--text)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    inverse: 'var(--text-inverse)',
  },
  // Surface layers
  surface: {
    default: 'var(--surface)',
    hover: 'var(--surface-hover)',
    pressed: 'var(--surface-pressed)',
    border: 'var(--surface-border)',
    borderHover: 'var(--surface-border-hover)',
  },
  // Primary brand
  primary: {
    default: 'var(--primary)',
    hover: 'var(--primary-hover)',
    pressed: 'var(--primary-pressed)',
    soft: 'var(--primary-soft)',
    text: 'var(--primary-text)',
  },
  // Status colors
  success: {
    default: 'var(--success)',
    soft: 'var(--success-soft)',
  },
  warning: {
    default: 'var(--warning)',
    soft: 'var(--warning-soft)',
  },
  error: {
    default: 'var(--error)',
    soft: 'var(--error-soft)',
  },
  // Glass
  glass: {
    bg: 'var(--glass-bg)',
    border: 'var(--glass-border)',
  },
  // Focus
  focus: 'var(--focus-ring)',
} as const;