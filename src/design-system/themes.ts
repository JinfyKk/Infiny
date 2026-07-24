/**
 * Theme Definitions - Updated to align with design system tokens
 * Each theme provides complete color tokens that map to CSS variables
 */

import type { ThemeName } from '@/theme/themes';
import { themes as originalThemes } from '@/theme/themes';

// Re-export types from original themes
export type { ThemeName, ThemeTokens } from '@/theme/themes';

// Extended theme tokens with design system integration
export interface DSTokens {
  // Color tokens (mapping to CSS variables)
  colors: {
    // Background
    bg: string;
    'bg-elevated': string;
    'bg-overlay': string;

    // Text
    text: string;
    'text-secondary': string;
    'text-muted': string;
    'text-inverse': string;

    // Surface
    surface: string;
    'surface-hover': string;
    'surface-pressed': string;
    'surface-border': string;
    'surface-border-hover': string;

    // Primary
    primary: string;
    'primary-hover': string;
    'primary-pressed': string;
    'primary-soft': string;
    'primary-text': string;

    // Status
    success: string;
    'success-soft': string;
    warning: string;
    'warning-soft': string;
    error: string;
    'error-soft': string;

    // Glass
    'glass-bg': string;
    'glass-border': string;

    // Focus
    'focus-ring': string;

    // RGB values for colored shadows
    'primary-rgb': string;
  };

  // Radius
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  // Transitions
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Convert original theme to design system format
function toDSTokens(theme: typeof originalThemes[keyof typeof originalThemes]): DSTokens {
  // Extract RGB from hex
  const hexToRgb = (hex: string): string => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  return {
    colors: {
      bg: theme.bg,
      'bg-elevated': theme['bg-elevated'],
      'bg-overlay': theme['bg-overlay'],
      text: theme.text,
      'text-secondary': theme['text-secondary'],
      'text-muted': theme['text-muted'],
      'text-inverse': theme['text-inverse'],
      surface: theme.surface,
      'surface-hover': theme['surface-hover'],
      'surface-pressed': theme['surface-pressed'],
      'surface-border': theme['surface-border'],
      'surface-border-hover': theme['surface-border-hover'],
      primary: theme.primary,
      'primary-hover': theme['primary-hover'],
      'primary-pressed': theme['primary-pressed'],
      'primary-soft': theme['primary-soft'],
      'primary-text': theme['primary-text'],
      success: theme.success,
      'success-soft': theme['success-soft'],
      warning: theme.warning,
      'warning-soft': theme['warning-soft'],
      error: theme.error,
      'error-soft': theme['error-soft'],
      'glass-bg': theme['glass-bg'],
      'glass-border': theme['glass-border'],
      'focus-ring': theme['focus-ring'],
      'primary-rgb': hexToRgb(theme.primary),
    },
    radius: {
      sm: theme['radius-sm'],
      md: theme['radius-md'],
      lg: theme['radius-lg'],
      xl: theme['radius-xl'],
      full: theme['radius-full'],
    },
    shadows: {
      sm: theme['shadow-sm'],
      md: theme['shadow-md'],
      lg: theme['shadow-lg'],
      xl: theme['shadow-xl'],
    },
    transitions: {
      fast: theme['transition-fast'],
      normal: theme['transition-normal'],
      slow: theme['transition-slow'],
    },
  };
}

// Generate all theme tokens
export const dsThemes: Record<ThemeName, DSTokens> = {
  pampas: toDSTokens(originalThemes.pampas),
  'dark-premium': toDSTokens(originalThemes['dark-premium']),
  'tech-blue': toDSTokens(originalThemes['tech-blue']),
  'natural-green': toDSTokens(originalThemes['natural-green']),
  monochrome: toDSTokens(originalThemes.monochrome),
  futuristic: toDSTokens(originalThemes.futuristic),
};

// Helper to get theme tokens
export function getDSTokens(themeName: ThemeName): DSTokens {
  return dsThemes[themeName] ?? dsThemes.pampas;
}

// Apply theme to DOM (enhanced version)
export function applyThemeToDOM(themeName: ThemeName): void {
  const tokens = getDSTokens(themeName);
  const root = document.documentElement;

  // Apply color tokens
  Object.entries(tokens.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Apply radius
  Object.entries(tokens.radius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });

  // Apply shadows
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });

  // Apply transitions
  Object.entries(tokens.transitions).forEach(([key, value]) => {
    root.style.setProperty(`--transition-${key}`, value);
  });

  root.setAttribute('data-theme', themeName);
  root.setAttribute('data-theme-rgb', tokens.colors['primary-rgb']);
}