export type ThemeName =
  | 'turtly-light'
  | 'turtly-forest'
  | 'pampas'
  | 'dark-premium'
  | 'tech-blue'
  | 'natural-green'
  | 'monochrome'
  | 'futuristic';

export interface ThemeTokens {
  // Background
  bg: string
  'bg-elevated': string
  'bg-overlay': string

  // Text
  text: string
  'text-secondary': string
  'text-muted': string
  'text-inverse': string

  // Surface
  surface: string
  'surface-hover': string
  'surface-pressed': string
  'surface-border': string
  'surface-border-hover': string

  // Primary / Accent
  primary: string
  'primary-hover': string
  'primary-pressed': string
  'primary-soft': string
  'primary-text': string

  // Accent
  accent: string
  'accent-hover': string
  'accent-pressed': string
  'accent-soft': string
  'accent-text': string

  // Status
  success: string
  'success-soft': string
  warning: string
  'warning-soft': string
  error: string
  'error-soft': string

  // Glass / Liquid Glass System
  'glass-bg': string
  'glass-border': string
  'glass-bg-hover': string
  'glass-border-hover': string
  'glass-shadow': string
  'glass-shadow-hover': string
  'glass-blur': string
  'glass-blur-hover': string

  // Glass Depth Levels (1-4)
  // Level 1: Subtle surface
  'glass-l1-bg': string
  'glass-l1-border': string
  'glass-l1-shadow': string
  'glass-l1-blur': string
  // Level 2: Elevated card
  'glass-l2-bg': string
  'glass-l2-border': string
  'glass-l2-shadow': string
  'glass-l2-blur': string
  // Level 3: Floating panel/dropdown
  'glass-l3-bg': string
  'glass-l3-border': string
  'glass-l3-shadow': string
  'glass-l3-blur': string
  // Level 4: Modal/overlay
  'glass-l4-bg': string
  'glass-l4-border': string
  'glass-l4-shadow': string
  'glass-l4-blur': string

  // Focus
  'focus-ring': string
  'focus-ring-offset': string

  // Radius
  'radius-sm': string
  'radius-md': string
  'radius-lg': string
  'radius-xl': string
  'radius-2xl': string
  'radius-full': string

  // Shadow
  'shadow-sm': string
  'shadow-md': string
  'shadow-lg': string
  'shadow-xl': string

  // Transition
  'transition-fast': string
  'transition-normal': string
  'transition-slow': string
  'transition-spring': string

  // Animation
  'anim-duration-fast': string
  'anim-duration-normal': string
  'anim-duration-slow': string
  'anim-easing-standard': string
  'anim-easing-spring': string
}

export const themes: Record<ThemeName, ThemeTokens> = {
  // --- 🐢 Turtly Light (Default) ---
  'turtly-light': {
    bg: '#F5F3EA',
    'bg-elevated': '#FFFFFF',
    'bg-overlay': 'rgba(38, 50, 56, 0.4)',

    text: '#263238',
    'text-secondary': '#5A6E6E',
    'text-muted': '#7D8F8F',
    'text-inverse': '#F5F3EA',

    surface: '#ECE8DD',
    'surface-hover': '#E0DCCC',
    'surface-pressed': '#D4CFBF',
    'surface-border': '#D4CFBF',
    'surface-border-hover': '#B8B0A0',

    primary: '#6FAF6A',
    'primary-hover': '#5E9C59',
    'primary-pressed': '#4D8A48',
    'primary-soft': '#E8F0E7',
    'primary-text': '#FFFFFF',

    accent: '#8BC34A',
    'accent-hover': '#7CB342',
    'accent-pressed': '#689F38',
    'accent-soft': '#F1F8E9',
    'accent-text': '#2E7D32',

    success: '#6FAF6A',
    'success-soft': '#E8F4E8',
    warning: '#E8A838',
    'warning-soft': '#FDF4E0',
    error: '#C86B6B',
    'error-soft': '#FBE8E8',

    'glass-bg': 'rgba(236, 232, 221, 0.72)',
    'glass-border': 'rgba(38, 50, 56, 0.06)',
    'glass-bg-hover': 'rgba(236, 232, 221, 0.88)',
    'glass-border-hover': 'rgba(38, 50, 56, 0.1)',
    'glass-shadow': '0 4px 24px -4px rgba(38, 50, 56, 0.08), 0 2px 8px -2px rgba(38, 50, 56, 0.05)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(38, 50, 56, 0.12), 0 4px 16px -4px rgba(38, 50, 56, 0.08)',
    'glass-blur': '24px',
    'glass-blur-hover': '32px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(236, 232, 221, 0.56)',
    'glass-l1-border': 'rgba(38, 50, 56, 0.04)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(38, 50, 56, 0.04)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(236, 232, 221, 0.72)',
    'glass-l2-border': 'rgba(38, 50, 56, 0.06)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(38, 50, 56, 0.06), 0 2px 6px -2px rgba(38, 50, 56, 0.04)',
    'glass-l2-blur': '24px',
    'glass-l3-bg': 'rgba(236, 232, 221, 0.82)',
    'glass-l3-border': 'rgba(38, 50, 56, 0.08)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(38, 50, 56, 0.1), 0 4px 16px -4px rgba(38, 50, 56, 0.06)',
    'glass-l3-blur': '32px',
    'glass-l4-bg': 'rgba(236, 232, 221, 0.9)',
    'glass-l4-border': 'rgba(38, 50, 56, 0.1)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(38, 50, 56, 0.14), 0 8px 24px -6px rgba(38, 50, 56, 0.08)',
    'glass-l4-blur': '40px',

    'focus-ring': '#6FAF6A',
    'focus-ring-offset': '#F5F3EA',

    'radius-sm': '0.25rem',
    'radius-md': '0.5rem',
    'radius-lg': '0.75rem',
    'radius-xl': '1rem',
    'radius-2xl': '1.25rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(38, 50, 56, 0.05)',
    'shadow-md': '0 4px 6px -1px rgba(38, 50, 56, 0.1), 0 2px 4px -2px rgba(38, 50, 56, 0.1)',
    'shadow-lg': '0 10px 15px -3px rgba(38, 50, 56, 0.1), 0 4px 6px -4px rgba(38, 50, 56, 0.1)',
    'shadow-xl': '0 20px 25px -5px rgba(38, 50, 56, 0.1), 0 8px 10px -6px rgba(38, 50, 56, 0.1)',

    'transition-fast': '100ms ease-out',
    'transition-normal': '150ms ease-out',
    'transition-slow': '200ms ease-out',
    'transition-spring': '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '100ms',
    'anim-duration-normal': '150ms',
    'anim-duration-slow': '200ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- 🌲 Turtly Forest ---
  'turtly-forest': {
    bg: '#1D1C1C',
    'bg-elevated': '#232323',
    'bg-overlay': 'rgba(241, 241, 232, 0.4)',

    text: '#F1F1E8',
    'text-secondary': '#B8B8A8',
    'text-muted': '#8D8D7D',
    'text-inverse': '#1D1C1C',

    surface: '#2A2A2A',
    'surface-hover': '#333333',
    'surface-pressed': '#3A3A3A',
    'surface-border': '#3A3A3A',
    'surface-border-hover': '#4A4A4A',

    primary: '#008000',
    'primary-hover': '#009900',
    'primary-pressed': '#006600',
    'primary-soft': '#1A3A1A',
    'primary-text': '#FFFFFF',

    accent: '#6B8E23',
    'accent-hover': '#7CB833',
    'accent-pressed': '#5B9E1B',
    'accent-soft': '#2A3A10',
    'accent-text': '#F1F1E8',

    success: '#6FAF6A',
    'success-soft': '#1A3A1A',
    warning: '#E8A838',
    'warning-soft': '#3A2A0A',
    error: '#C86B6B',
    'error-soft': '#3A1A1A',

    'glass-bg': 'rgba(42, 42, 42, 0.72)',
    'glass-border': 'rgba(241, 241, 232, 0.04)',
    'glass-bg-hover': 'rgba(42, 42, 42, 0.88)',
    'glass-border-hover': 'rgba(241, 241, 232, 0.08)',
    'glass-shadow': '0 4px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(107, 142, 35, 0.08)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(0, 0, 0, 0.5), 0 4px 16px -4px rgba(107, 142, 35, 0.12)',
    'glass-blur': '24px',
    'glass-blur-hover': '32px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(42, 42, 42, 0.56)',
    'glass-l1-border': 'rgba(241, 241, 232, 0.02)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(0, 0, 0, 0.2)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(42, 42, 42, 0.72)',
    'glass-l2-border': 'rgba(241, 241, 232, 0.04)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(0, 0, 0, 0.3), 0 2px 6px -2px rgba(0, 0, 0, 0.2)',
    'glass-l2-blur': '24px',
    'glass-l3-bg': 'rgba(42, 42, 42, 0.82)',
    'glass-l3-border': 'rgba(241, 241, 232, 0.06)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(0, 0, 0, 0.4), 0 4px 16px -4px rgba(0, 0, 0, 0.3)',
    'glass-l3-blur': '32px',
    'glass-l4-bg': 'rgba(42, 42, 42, 0.92)',
    'glass-l4-border': 'rgba(241, 241, 232, 0.08)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(0, 0, 0, 0.5), 0 8px 24px -6px rgba(0, 0, 0, 0.4)',
    'glass-l4-blur': '40px',

    'focus-ring': '#6B8E23',
    'focus-ring-offset': '#1D1C1C',

    'radius-sm': '0.25rem',
    'radius-md': '0.5rem',
    'radius-lg': '0.75rem',
    'radius-xl': '1rem',
    'radius-2xl': '1.25rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',

    'transition-fast': '100ms ease-out',
    'transition-normal': '150ms ease-out',
    'transition-slow': '200ms ease-out',
    'transition-spring': '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '100ms',
    'anim-duration-normal': '150ms',
    'anim-duration-slow': '200ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- Pampas / Terracota (Obrigatório) ---
  pampas: {
    bg: '#F4F3EE',
    'bg-elevated': '#FFFFFF',
    'bg-overlay': 'rgba(20, 20, 19, 0.4)',

    text: '#141413',
    'text-secondary': '#B1ADA1',
    'text-muted': '#8A887E',
    'text-inverse': '#F4F3EE',

    surface: '#E8E6DC',
    'surface-hover': '#DCDAE0',
    'surface-pressed': '#CFCBC1',
    'surface-border': '#CFCBC1',
    'surface-border-hover': '#B1ADA1',

    primary: '#C15F3C',
    'primary-hover': '#A85234',
    'primary-pressed': '#8F472D',
    'primary-soft': '#F5E8E3',
    'primary-text': '#FFFFFF',

    accent: '#D4A574',
    'accent-hover': '#C89464',
    'accent-pressed': '#B08354',
    'accent-soft': '#F5EDE3',
    'accent-text': '#141413',

    success: '#4A7C59',
    'success-soft': '#E5F0E7',
    warning: '#C18A3C',
    'warning-soft': '#F5EDE3',
    error: '#C15F3C',
    'error-soft': '#F5E8E3',

    'glass-bg': 'rgba(232, 230, 220, 0.72)',
    'glass-border': 'rgba(20, 20, 19, 0.06)',
    'glass-bg-hover': 'rgba(232, 230, 220, 0.88)',
    'glass-border-hover': 'rgba(20, 20, 19, 0.1)',
    'glass-shadow': '0 4px 24px -4px rgba(20, 20, 19, 0.08), 0 2px 8px -2px rgba(20, 20, 19, 0.05)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(20, 20, 19, 0.12), 0 4px 16px -4px rgba(20, 20, 19, 0.08)',
    'glass-blur': '24px',
    'glass-blur-hover': '32px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(232, 230, 220, 0.56)',
    'glass-l1-border': 'rgba(20, 20, 19, 0.04)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(20, 20, 19, 0.04)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(232, 230, 220, 0.72)',
    'glass-l2-border': 'rgba(20, 20, 19, 0.06)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(20, 20, 19, 0.06), 0 2px 6px -2px rgba(20, 20, 19, 0.04)',
    'glass-l2-blur': '24px',
    'glass-l3-bg': 'rgba(232, 230, 220, 0.82)',
    'glass-l3-border': 'rgba(20, 20, 19, 0.08)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(20, 20, 19, 0.1), 0 4px 16px -4px rgba(20, 20, 19, 0.06)',
    'glass-l3-blur': '32px',
    'glass-l4-bg': 'rgba(232, 230, 220, 0.9)',
    'glass-l4-border': 'rgba(20, 20, 19, 0.1)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(20, 20, 19, 0.14), 0 8px 24px -6px rgba(20, 20, 19, 0.08)',
    'glass-l4-blur': '40px',

    'focus-ring': '#C15F3C',
    'focus-ring-offset': '#F4F3EE',

    'radius-sm': '0.25rem',
    'radius-md': '0.5rem',
    'radius-lg': '0.75rem',
    'radius-xl': '1rem',
    'radius-2xl': '1.25rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(20, 20, 19, 0.05)',
    'shadow-md': '0 4px 6px -1px rgba(20, 20, 19, 0.1), 0 2px 4px -2px rgba(20, 20, 19, 0.1)',
    'shadow-lg': '0 10px 15px -3px rgba(20, 20, 19, 0.1), 0 4px 6px -4px rgba(20, 20, 19, 0.1)',
    'shadow-xl': '0 20px 25px -5px rgba(20, 20, 19, 0.1), 0 8px 10px -6px rgba(20, 20, 19, 0.1)',

    'transition-fast': '100ms ease-out',
    'transition-normal': '150ms ease-out',
    'transition-slow': '200ms ease-out',
    'transition-spring': '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '100ms',
    'anim-duration-normal': '150ms',
    'anim-duration-slow': '200ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- Dark Premium ---
  'dark-premium': {
    bg: '#0A0A0B',
    'bg-elevated': '#131314',
    'bg-overlay': 'rgba(0, 0, 0, 0.6)',

    text: '#FAFAFA',
    'text-secondary': '#A3A3A3',
    'text-muted': '#737373',
    'text-inverse': '#0A0A0B',

    surface: '#1A1A1B',
    'surface-hover': '#232324',
    'surface-pressed': '#2A2A2B',
    'surface-border': '#2A2A2B',
    'surface-border-hover': '#404040',

    primary: '#E8E8E8',
    'primary-hover': '#F5F5F5',
    'primary-pressed': '#D4D4D4',
    'primary-soft': '#2A2A2B',
    'primary-text': '#0A0A0B',

    accent: '#A5D6A7',
    'accent-hover': '#81C784',
    'accent-pressed': '#66BB6A',
    'accent-soft': '#1A3A1A',
    'accent-text': '#0A0A0B',

    success: '#4ADE80',
    'success-soft': '#14532D',
    warning: '#FACC15',
    'warning-soft': '#713F12',
    error: '#F87171',
    'error-soft': '#7F1D1D',

    'glass-bg': 'rgba(26, 26, 27, 0.72)',
    'glass-border': 'rgba(250, 250, 250, 0.04)',
    'glass-bg-hover': 'rgba(26, 26, 27, 0.88)',
    'glass-border-hover': 'rgba(250, 250, 250, 0.08)',
    'glass-shadow': '0 4px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(0, 0, 0, 0.3)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(0, 0, 0, 0.5), 0 4px 16px -4px rgba(0, 0, 0, 0.4)',
    'glass-blur': '24px',
    'glass-blur-hover': '32px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(26, 26, 27, 0.56)',
    'glass-l1-border': 'rgba(250, 250, 250, 0.02)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(0, 0, 0, 0.2)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(26, 26, 27, 0.72)',
    'glass-l2-border': 'rgba(250, 250, 250, 0.04)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(0, 0, 0, 0.3), 0 2px 6px -2px rgba(0, 0, 0, 0.2)',
    'glass-l2-blur': '24px',
    'glass-l3-bg': 'rgba(26, 26, 27, 0.82)',
    'glass-l3-border': 'rgba(250, 250, 250, 0.06)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(0, 0, 0, 0.4), 0 4px 16px -4px rgba(0, 0, 0, 0.3)',
    'glass-l3-blur': '32px',
    'glass-l4-bg': 'rgba(26, 26, 27, 0.92)',
    'glass-l4-border': 'rgba(250, 250, 250, 0.08)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(0, 0, 0, 0.5), 0 8px 24px -6px rgba(0, 0, 0, 0.4)',
    'glass-l4-blur': '40px',

    'focus-ring': '#E8E8E8',
    'focus-ring-offset': '#0A0A0B',

    'radius-sm': '0.25rem',
    'radius-md': '0.5rem',
    'radius-lg': '0.75rem',
    'radius-xl': '1rem',
    'radius-2xl': '1.25rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',

    'transition-fast': '100ms ease-out',
    'transition-normal': '150ms ease-out',
    'transition-slow': '200ms ease-out',
    'transition-spring': '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '100ms',
    'anim-duration-normal': '150ms',
    'anim-duration-slow': '200ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- Tech Blue ---
  'tech-blue': {
    bg: '#061426',
    'bg-elevated': '#0C1F3A',
    'bg-overlay': 'rgba(6, 20, 38, 0.7)',

    text: '#E8F1FB',
    'text-secondary': '#8BA4C8',
    'text-muted': '#5A7A9E',
    'text-inverse': '#061426',

    surface: '#0F2442',
    'surface-hover': '#152D4E',
    'surface-pressed': '#1A3A5E',
    'surface-border': '#1E3A5F',
    'surface-border-hover': '#2A4A6E',

    primary: '#3B9CFF',
    'primary-hover': '#5AAEFF',
    'primary-pressed': '#2A88E6',
    'primary-soft': '#15304E',
    'primary-text': '#061426',

    accent: '#00E5FF',
    'accent-hover': '#18FFFF',
    'accent-pressed': '#00CCD6',
    'accent-soft': '#0A2A2E',
    'accent-text': '#061426',

    success: '#22D39A',
    'success-soft': '#0A3D2E',
    warning: '#F5A623',
    'warning-soft': '#3D2A0A',
    error: '#FF5A5F',
    'error-soft': '#3D1516',

    'glass-bg': 'rgba(15, 36, 66, 0.72)',
    'glass-border': 'rgba(59, 156, 255, 0.08)',
    'glass-bg-hover': 'rgba(15, 36, 66, 0.88)',
    'glass-border-hover': 'rgba(59, 156, 255, 0.14)',
    'glass-shadow': '0 4px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(59, 156, 255, 0.08)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(0, 0, 0, 0.5), 0 4px 16px -4px rgba(59, 156, 255, 0.12)',
    'glass-blur': '24px',
    'glass-blur-hover': '32px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(15, 36, 66, 0.56)',
    'glass-l1-border': 'rgba(59, 156, 255, 0.04)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(0, 0, 0, 0.25)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(15, 36, 66, 0.72)',
    'glass-l2-border': 'rgba(59, 156, 255, 0.08)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(0, 0, 0, 0.35), 0 2px 6px -2px rgba(59, 156, 255, 0.06)',
    'glass-l2-blur': '24px',
    'glass-l3-bg': 'rgba(15, 36, 66, 0.82)',
    'glass-l3-border': 'rgba(59, 156, 255, 0.12)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(0, 0, 0, 0.4), 0 4px 16px -4px rgba(59, 156, 255, 0.1)',
    'glass-l3-blur': '32px',
    'glass-l4-bg': 'rgba(15, 36, 66, 0.92)',
    'glass-l4-border': 'rgba(59, 156, 255, 0.16)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(0, 0, 0, 0.45), 0 8px 24px -6px rgba(59, 156, 255, 0.14)',
    'glass-l4-blur': '40px',

    'focus-ring': '#3B9CFF',
    'focus-ring-offset': '#061426',

    'radius-sm': '0.1875rem',
    'radius-md': '0.375rem',
    'radius-lg': '0.5rem',
    'radius-xl': '0.75rem',
    'radius-2xl': '1rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    'shadow-md': '0 4px 8px -2px rgba(59, 156, 255, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    'shadow-lg': '0 12px 24px -4px rgba(59, 156, 255, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.3)',
    'shadow-xl': '0 24px 48px -8px rgba(59, 156, 255, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.3)',

    'transition-fast': '80ms ease-out',
    'transition-normal': '120ms ease-out',
    'transition-slow': '160ms ease-out',
    'transition-spring': '250ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '80ms',
    'anim-duration-normal': '120ms',
    'anim-duration-slow': '160ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- Natural Green ---
  'natural-green': {
    bg: '#F1F5EF',
    'bg-elevated': '#FFFFFF',
    'bg-overlay': 'rgba(22, 42, 22, 0.4)',

    text: '#162A16',
    'text-secondary': '#6B8B6B',
    'text-muted': '#8FA58F',
    'text-inverse': '#F1F5EF',

    surface: '#E4ECE0',
    'surface-hover': '#D6E0D4',
    'surface-pressed': '#C8D4C7',
    'surface-border': '#BCD0BA',
    'surface-border-hover': '#9EB89E',

    primary: '#2E7D32',
    'primary-hover': '#256628',
    'primary-pressed': '#1D4F1E',
    'primary-soft': '#E8F3E8',
    'primary-text': '#FFFFFF',

    accent: '#8BC34A',
    'accent-hover': '#7CB342',
    'accent-pressed': '#689F38',
    'accent-soft': '#F1F8E9',
    'accent-text': '#1B5E20',

    success: '#388E3C',
    'success-soft': '#E8F5E9',
    warning: '#C8962E',
    'warning-soft': '#F5F0E0',
    error: '#C62828',
    'error-soft': '#FCEEEE',

    'glass-bg': 'rgba(228, 236, 224, 0.72)',
    'glass-border': 'rgba(22, 42, 22, 0.06)',
    'glass-bg-hover': 'rgba(228, 236, 224, 0.88)',
    'glass-border-hover': 'rgba(22, 42, 22, 0.1)',
    'glass-shadow': '0 4px 24px -4px rgba(22, 42, 22, 0.08), 0 2px 8px -2px rgba(22, 42, 22, 0.05)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(22, 42, 22, 0.12), 0 4px 16px -4px rgba(22, 42, 22, 0.08)',
    'glass-blur': '24px',
    'glass-blur-hover': '32px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(228, 236, 224, 0.56)',
    'glass-l1-border': 'rgba(22, 42, 22, 0.04)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(22, 42, 22, 0.04)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(228, 236, 224, 0.72)',
    'glass-l2-border': 'rgba(22, 42, 22, 0.06)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(22, 42, 22, 0.06), 0 2px 6px -2px rgba(22, 42, 22, 0.04)',
    'glass-l2-blur': '24px',
    'glass-l3-bg': 'rgba(228, 236, 224, 0.82)',
    'glass-l3-border': 'rgba(22, 42, 22, 0.08)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(22, 42, 22, 0.1), 0 4px 16px -4px rgba(22, 42, 22, 0.06)',
    'glass-l3-blur': '32px',
    'glass-l4-bg': 'rgba(228, 236, 224, 0.9)',
    'glass-l4-border': 'rgba(22, 42, 22, 0.1)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(22, 42, 22, 0.14), 0 8px 24px -6px rgba(22, 42, 22, 0.08)',
    'glass-l4-blur': '40px',

    'focus-ring': '#2E7D32',
    'focus-ring-offset': '#F1F5EF',

    'radius-sm': '0.3125rem',
    'radius-md': '0.625rem',
    'radius-lg': '0.9375rem',
    'radius-xl': '1.25rem',
    'radius-2xl': '1.5rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(22, 42, 22, 0.06)',
    'shadow-md': '0 4px 8px -2px rgba(22, 42, 22, 0.1), 0 2px 4px -1px rgba(22, 42, 22, 0.08)',
    'shadow-lg': '0 12px 24px -4px rgba(22, 42, 22, 0.12), 0 4px 8px -2px rgba(22, 42, 22, 0.08)',
    'shadow-xl': '0 24px 48px -8px rgba(22, 42, 22, 0.15), 0 8px 16px -4px rgba(22, 42, 22, 0.1)',

    'transition-fast': '120ms ease-out',
    'transition-normal': '180ms ease-out',
    'transition-slow': '240ms ease-out',
    'transition-spring': '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '120ms',
    'anim-duration-normal': '180ms',
    'anim-duration-slow': '240ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- Monochrome ---
  monochrome: {
    bg: '#FFFFFF',
    'bg-elevated': '#FAFAFA',
    'bg-overlay': 'rgba(0, 0, 0, 0.4)',

    text: '#000000',
    'text-secondary': '#666666',
    'text-muted': '#999999',
    'text-inverse': '#FFFFFF',

    surface: '#F5F5F5',
    'surface-hover': '#EEEEEE',
    'surface-pressed': '#E0E0E0',
    'surface-border': '#E0E0E0',
    'surface-border-hover': '#CCCCCC',

    primary: '#000000',
    'primary-hover': '#1A1A1A',
    'primary-pressed': '#333333',
    'primary-soft': '#F5F5F5',
    'primary-text': '#FFFFFF',

    accent: '#666666',
    'accent-hover': '#777777',
    'accent-pressed': '#555555',
    'accent-soft': '#F0F0F0',
    'accent-text': '#FFFFFF',

    success: '#006600',
    'success-soft': '#E8F5E8',
    warning: '#996600',
    'warning-soft': '#F5F0E0',
    error: '#CC0000',
    'error-soft': '#FCEEEE',

    'glass-bg': 'rgba(245, 245, 245, 0.72)',
    'glass-border': 'rgba(0, 0, 0, 0.04)',
    'glass-bg-hover': 'rgba(245, 245, 245, 0.88)',
    'glass-border-hover': 'rgba(0, 0, 0, 0.08)',
    'glass-shadow': '0 4px 24px -4px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(0, 0, 0, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.06)',
    'glass-blur': '20px',
    'glass-blur-hover': '28px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(245, 245, 245, 0.5)',
    'glass-l1-border': 'rgba(0, 0, 0, 0.02)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(0, 0, 0, 0.03)',
    'glass-l1-blur': '12px',
    'glass-l2-bg': 'rgba(245, 245, 245, 0.72)',
    'glass-l2-border': 'rgba(0, 0, 0, 0.04)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
    'glass-l2-blur': '20px',
    'glass-l3-bg': 'rgba(245, 245, 245, 0.82)',
    'glass-l3-border': 'rgba(0, 0, 0, 0.06)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.05)',
    'glass-l3-blur': '28px',
    'glass-l4-bg': 'rgba(245, 245, 245, 0.92)',
    'glass-l4-border': 'rgba(0, 0, 0, 0.08)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(0, 0, 0, 0.12), 0 8px 24px -6px rgba(0, 0, 0, 0.06)',
    'glass-l4-blur': '36px',

    'focus-ring': '#000000',
    'focus-ring-offset': '#FFFFFF',

    'radius-sm': '0.125rem',
    'radius-md': '0.25rem',
    'radius-lg': '0.5rem',
    'radius-xl': '0.75rem',
    'radius-2xl': '1rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    'shadow-md': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    'shadow-lg': '0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
    'shadow-xl': '0 16px 32px -8px rgba(0, 0, 0, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',

    'transition-fast': '80ms ease',
    'transition-normal': '120ms ease',
    'transition-slow': '160ms ease',
    'transition-spring': '250ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '80ms',
    'anim-duration-normal': '120ms',
    'anim-duration-slow': '160ms',
    'anim-easing-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // --- Futuristic ---
  futuristic: {
    bg: '#050508',
    'bg-elevated': '#0D0D14',
    'bg-overlay': 'rgba(5, 5, 8, 0.8)',

    text: '#F0F0F5',
    'text-secondary': '#A0A0B0',
    'text-muted': '#6A6A7A',
    'text-inverse': '#050508',

    surface: '#12121A',
    'surface-hover': '#1A1A24',
    'surface-pressed': '#22222E',
    'surface-border': '#2A2A3A',
    'surface-border-hover': '#3A3A4A',

    primary: '#00FFC8',
    'primary-hover': '#33FFD6',
    'primary-pressed': '#00CCA0',
    'primary-soft': '#0A2A24',
    'primary-text': '#050508',

    accent: '#FF6B35',
    'accent-hover': '#FF8555',
    'accent-pressed': '#E05528',
    'accent-soft': '#2A150A',
    'accent-text': '#050508',

    success: '#00FF88',
    'success-soft': '#0A2A1A',
    warning: '#FFCC00',
    'warning-soft': '#2A220A',
    error: '#FF3366',
    'error-soft': '#2A0A12',

    'glass-bg': 'rgba(18, 18, 26, 0.8)',
    'glass-border': 'rgba(0, 255, 200, 0.1)',
    'glass-bg-hover': 'rgba(18, 18, 26, 0.92)',
    'glass-border-hover': 'rgba(0, 255, 200, 0.18)',
    'glass-shadow': '0 4px 24px -4px rgba(0, 255, 200, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.4)',
    'glass-shadow-hover': '0 8px 32px -6px rgba(0, 255, 200, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.5)',
    'glass-blur': '28px',
    'glass-blur-hover': '36px',

    // Glass Depth Levels
    'glass-l1-bg': 'rgba(18, 18, 26, 0.6)',
    'glass-l1-border': 'rgba(0, 255, 200, 0.04)',
    'glass-l1-shadow': '0 2px 8px -2px rgba(0, 0, 0, 0.3)',
    'glass-l1-blur': '16px',
    'glass-l2-bg': 'rgba(18, 18, 26, 0.8)',
    'glass-l2-border': 'rgba(0, 255, 200, 0.1)',
    'glass-l2-shadow': '0 4px 16px -3px rgba(0, 255, 200, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
    'glass-l2-blur': '28px',
    'glass-l3-bg': 'rgba(18, 18, 26, 0.9)',
    'glass-l3-border': 'rgba(0, 255, 200, 0.14)',
    'glass-l3-shadow': '0 8px 32px -6px rgba(0, 255, 200, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.4)',
    'glass-l3-blur': '36px',
    'glass-l4-bg': 'rgba(18, 18, 26, 0.96)',
    'glass-l4-border': 'rgba(0, 255, 200, 0.18)',
    'glass-l4-shadow': '0 16px 48px -8px rgba(0, 255, 200, 0.14), 0 8px 24px -6px rgba(0, 0, 0, 0.5)',
    'glass-l4-blur': '48px',

    'focus-ring': '#00FFC8',
    'focus-ring-offset': '#050508',

    'radius-sm': '0.125rem',
    'radius-md': '0.375rem',
    'radius-lg': '0.625rem',
    'radius-xl': '1rem',
    'radius-2xl': '1.25rem',
    'radius-full': '9999px',

    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    'shadow-md': '0 4px 12px -2px rgba(0, 255, 200, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
    'shadow-lg': '0 16px 32px -4px rgba(0, 255, 200, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.4)',
    'shadow-xl': '0 32px 64px -8px rgba(0, 255, 200, 0.12), 0 16px 32px -8px rgba(0, 0, 0, 0.4)',

    'transition-fast': '60ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    'transition-normal': '100ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    'transition-slow': '150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    'transition-spring': '200ms cubic-bezier(0.34, 1.56, 0.64, 1)',

    'anim-duration-fast': '60ms',
    'anim-duration-normal': '100ms',
    'anim-duration-slow': '150ms',
    'anim-easing-standard': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'anim-easing-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const themeLabels: Record<ThemeName, string> = {
  'turtly-light': '🐢 Turtly Light',
  'turtly-forest': '🌲 Turtly Forest',
  pampas: 'Pampas / Terracota',
  'dark-premium': 'Dark Premium',
  'tech-blue': 'Tech Blue',
  'natural-green': 'Natural Green',
  monochrome: 'Monocromático',
  futuristic: 'Futurista',
};

export const themeDescriptions: Record<ThemeName, string> = {
  'turtly-light': 'Claro, natural, moderno e confortável — inspirado na Turtly',
  'turtly-forest': 'Floresta, escuro elegante, inspirado na natureza',
  pampas: 'Tons quentes de areia e terracota — acolhedor e legível',
  'dark-premium': 'Preto profundo com branco puro — elegante e focado',
  'tech-blue': 'Azul tecnológico escuro — para sessões longas de código',
  'natural-green': 'Verde natural suave — reduz fadiga visual',
  monochrome: 'Preto e branco puro — minimalista e nítido',
  futuristic: 'Ciano neon sobre preto — identidade tech ousada',
};

export const defaultTheme: ThemeName = 'turtly-light';

export function getThemeTokens(name: ThemeName): ThemeTokens {
  return themes[name] ?? themes[defaultTheme];
}

export function applyThemeToDOM(name: ThemeName): void {
  const tokens = getThemeTokens(name);
  const root = document.documentElement;

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.setAttribute('data-theme', name);
}