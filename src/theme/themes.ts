export type ThemeName =
  | 'pampas'
  | 'dark-premium'
  | 'tech-blue'
  | 'natural-green'
  | 'monochrome'
  | 'futuristic';

export interface ThemeTokens {
  // Background
  bg: string;
  bgElevated: string;
  bgOverlay: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Surface
  surface: string;
  surfaceHover: string;
  surfacePressed: string;
  surfaceBorder: string;
  surfaceBorderHover: string;

  // Primary / Accent
  primary: string;
  primaryHover: string;
  primaryPressed: string;
  primarySoft: string;
  primaryText: string;

  // Status
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;

  // Glass
  glassBg: string;
  glassBorder: string;

  // Focus
  focusRing: string;

  // Radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;

  // Shadow
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;

  // Transition
  transitionFast: string;
  transitionNormal: string;
  transitionSlow: string;
}

export const themes: Record<ThemeName, ThemeTokens> = {
  // --- Pampas / Terracota (Obrigatório) ---
  pampas: {
    bg: '#F4F3EE',
    bgElevated: '#FFFFFF',
    bgOverlay: 'rgba(20, 20, 19, 0.4)',

    text: '#141413',
    textSecondary: '#B1ADA1',
    textMuted: '#8A887E',
    textInverse: '#F4F3EE',

    surface: '#E8E6DC',
    surfaceHover: '#DCDAE0',
    surfacePressed: '#CFCBC1',
    surfaceBorder: '#CFCBC1',
    surfaceBorderHover: '#B1ADA1',

    primary: '#C15F3C',
    primaryHover: '#A85234',
    primaryPressed: '#8F472D',
    primarySoft: '#F5E8E3',
    primaryText: '#FFFFFF',

    success: '#4A7C59',
    successSoft: '#E5F0E7',
    warning: '#C18A3C',
    warningSoft: '#F5EDE3',
    error: '#C15F3C',
    errorSoft: '#F5E8E3',

    glassBg: 'rgba(232, 230, 220, 0.85)',
    glassBorder: 'rgba(20, 20, 19, 0.08)',

    focusRing: '#C15F3C',

    radiusSm: '0.25rem',
    radiusMd: '0.5rem',
    radiusLg: '0.75rem',
    radiusXl: '1rem',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px 0 rgba(20, 20, 19, 0.05)',
    shadowMd: '0 4px 6px -1px rgba(20, 20, 19, 0.1), 0 2px 4px -2px rgba(20, 20, 19, 0.1)',
    shadowLg: '0 10px 15px -3px rgba(20, 20, 19, 0.1), 0 4px 6px -4px rgba(20, 20, 19, 0.1)',
    shadowXl: '0 20px 25px -5px rgba(20, 20, 19, 0.1), 0 8px 10px -6px rgba(20, 20, 19, 0.1)',

    transitionFast: '100ms ease-out',
    transitionNormal: '150ms ease-out',
    transitionSlow: '200ms ease-out',
  },

  // --- Dark Premium ---
  'dark-premium': {
    bg: '#0A0A0B',
    bgElevated: '#131314',
    bgOverlay: 'rgba(0, 0, 0, 0.6)',

    text: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    textInverse: '#0A0A0B',

    surface: '#1A1A1B',
    surfaceHover: '#232324',
    surfacePressed: '#2A2A2B',
    surfaceBorder: '#2A2A2B',
    surfaceBorderHover: '#404040',

    primary: '#E8E8E8',
    primaryHover: '#F5F5F5',
    primaryPressed: '#D4D4D4',
    primarySoft: '#2A2A2B',
    primaryText: '#0A0A0B',

    success: '#4ADE80',
    successSoft: '#14532D',
    warning: '#FACC15',
    warningSoft: '#713F12',
    error: '#F87171',
    errorSoft: '#7F1D1D',

    glassBg: 'rgba(26, 26, 27, 0.85)',
    glassBorder: 'rgba(250, 250, 250, 0.06)',

    focusRing: '#E8E8E8',

    radiusSm: '0.25rem',
    radiusMd: '0.5rem',
    radiusLg: '0.75rem',
    radiusXl: '1rem',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',

    transitionFast: '100ms ease-out',
    transitionNormal: '150ms ease-out',
    transitionSlow: '200ms ease-out',
  },

  // --- Tech Blue ---
  'tech-blue': {
    bg: '#061426',
    bgElevated: '#0C1F3A',
    bgOverlay: 'rgba(6, 20, 38, 0.7)',

    text: '#E8F1FB',
    textSecondary: '#8BA4C8',
    textMuted: '#5A7A9E',
    textInverse: '#061426',

    surface: '#0F2442',
    surfaceHover: '#152D4E',
    surfacePressed: '#1A3A5E',
    surfaceBorder: '#1E3A5F',
    surfaceBorderHover: '#2A4A6E',

    primary: '#3B9CFF',
    primaryHover: '#5AAEFF',
    primaryPressed: '#2A88E6',
    primarySoft: '#15304E',
    primaryText: '#061426',

    success: '#22D39A',
    successSoft: '#0A3D2E',
    warning: '#F5A623',
    warningSoft: '#3D2A0A',
    error: '#FF5A5F',
    errorSoft: '#3D1516',

    glassBg: 'rgba(15, 36, 66, 0.85)',
    glassBorder: 'rgba(59, 156, 255, 0.12)',

    focusRing: '#3B9CFF',

    radiusSm: '0.1875rem',
    radiusMd: '0.375rem',
    radiusLg: '0.5rem',
    radiusXl: '0.75rem',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    shadowMd: '0 4px 8px -2px rgba(59, 156, 255, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 12px 24px -4px rgba(59, 156, 255, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.3)',
    shadowXl: '0 24px 48px -8px rgba(59, 156, 255, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.3)',

    transitionFast: '80ms ease-out',
    transitionNormal: '120ms ease-out',
    transitionSlow: '160ms ease-out',
  },

  // --- Natural Green ---
  'natural-green': {
    bg: '#F1F5EF',
    bgElevated: '#FFFFFF',
    bgOverlay: 'rgba(22, 42, 22, 0.4)',

    text: '#162A16',
    textSecondary: '#6B8B6B',
    textMuted: '#8FA58F',
    textInverse: '#F1F5EF',

    surface: '#E4ECE0',
    surfaceHover: '#D6E0D4',
    surfacePressed: '#C8D4C7',
    surfaceBorder: '#BCD0BA',
    surfaceBorderHover: '#9EB89E',

    primary: '#2E7D32',
    primaryHover: '#256628',
    primaryPressed: '#1D4F1E',
    primarySoft: '#E8F3E8',
    primaryText: '#FFFFFF',

    success: '#388E3C',
    successSoft: '#E8F5E9',
    warning: '#C8962E',
    warningSoft: '#F5F0E0',
    error: '#C62828',
    errorSoft: '#FCEEEE',

    glassBg: 'rgba(228, 236, 224, 0.85)',
    glassBorder: 'rgba(22, 42, 22, 0.08)',

    focusRing: '#2E7D32',

    radiusSm: '0.3125rem',
    radiusMd: '0.625rem',
    radiusLg: '0.9375rem',
    radiusXl: '1.25rem',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px 0 rgba(22, 42, 22, 0.06)',
    shadowMd: '0 4px 8px -2px rgba(22, 42, 22, 0.1), 0 2px 4px -1px rgba(22, 42, 22, 0.08)',
    shadowLg: '0 12px 24px -4px rgba(22, 42, 22, 0.12), 0 4px 8px -2px rgba(22, 42, 22, 0.08)',
    shadowXl: '0 24px 48px -8px rgba(22, 42, 22, 0.15), 0 8px 16px -4px rgba(22, 42, 22, 0.1)',

    transitionFast: '120ms ease-out',
    transitionNormal: '180ms ease-out',
    transitionSlow: '240ms ease-out',
  },

  // --- Monochrome ---
  monochrome: {
    bg: '#FFFFFF',
    bgElevated: '#FAFAFA',
    bgOverlay: 'rgba(0, 0, 0, 0.4)',

    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    textInverse: '#FFFFFF',

    surface: '#F5F5F5',
    surfaceHover: '#EEEEEE',
    surfacePressed: '#E0E0E0',
    surfaceBorder: '#E0E0E0',
    surfaceBorderHover: '#CCCCCC',

    primary: '#000000',
    primaryHover: '#1A1A1A',
    primaryPressed: '#333333',
    primarySoft: '#F5F5F5',
    primaryText: '#FFFFFF',

    success: '#006600',
    successSoft: '#E8F5E8',
    warning: '#996600',
    warningSoft: '#F5F0E0',
    error: '#CC0000',
    errorSoft: '#FCEEEE',

    glassBg: 'rgba(245, 245, 245, 0.85)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',

    focusRing: '#000000',

    radiusSm: '0.125rem',
    radiusMd: '0.25rem',
    radiusLg: '0.5rem',
    radiusXl: '0.75rem',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    shadowMd: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    shadowLg: '0 8px 16px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
    shadowXl: '0 16px 32px -8px rgba(0, 0, 0, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',

    transitionFast: '80ms ease',
    transitionNormal: '120ms ease',
    transitionSlow: '160ms ease',
  },

  // --- Futuristic ---
  futuristic: {
    bg: '#050508',
    bgElevated: '#0D0D14',
    bgOverlay: 'rgba(5, 5, 8, 0.8)',

    text: '#F0F0F5',
    textSecondary: '#A0A0B0',
    textMuted: '#6A6A7A',
    textInverse: '#050508',

    surface: '#12121A',
    surfaceHover: '#1A1A24',
    surfacePressed: '#22222E',
    surfaceBorder: '#2A2A3A',
    surfaceBorderHover: '#3A3A4A',

    primary: '#00FFC8',
    primaryHover: '#33FFD6',
    primaryPressed: '#00CCA0',
    primarySoft: '#0A2A24',
    primaryText: '#050508',

    success: '#00FF88',
    successSoft: '#0A2A1A',
    warning: '#FFCC00',
    warningSoft: '#2A220A',
    error: '#FF3366',
    errorSoft: '#2A0A12',

    glassBg: 'rgba(18, 18, 26, 0.9)',
    glassBorder: 'rgba(0, 255, 200, 0.15)',

    focusRing: '#00FFC8',

    radiusSm: '0.125rem',
    radiusMd: '0.375rem',
    radiusLg: '0.625rem',
    radiusXl: '1rem',
    radiusFull: '9999px',

    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    shadowMd: '0 4px 12px -2px rgba(0, 255, 200, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 16px 32px -4px rgba(0, 255, 200, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.4)',
    shadowXl: '0 32px 64px -8px rgba(0, 255, 200, 0.12), 0 16px 32px -8px rgba(0, 0, 0, 0.4)',

    transitionFast: '60ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    transitionNormal: '100ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    transitionSlow: '150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const themeLabels: Record<ThemeName, string> = {
  pampas: 'Pampas / Terracota',
  'dark-premium': 'Dark Premium',
  'tech-blue': 'Tech Blue',
  'natural-green': 'Natural Green',
  monochrome: 'Monocromático',
  futuristic: 'Futurista',
};

export const themeDescriptions: Record<ThemeName, string> = {
  pampas: 'Tons quentes de areia e terracota — acolhedor e legível',
  'dark-premium': 'Preto profundo com branco puro — elegante e focado',
  'tech-blue': 'Azul tecnológico escuro — para sessões longas de código',
  'natural-green': 'Verde natural suave — reduz fadiga visual',
  monochrome: 'Preto e branco puro — minimalista e nítido',
  futuristic: 'Ciano neon sobre preto — identidade tech ousada',
};

export const defaultTheme: ThemeName = 'pampas';

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