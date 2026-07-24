import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type ThemeName, defaultTheme } from './themes'
import { applyThemeToDOM as applyDSTheme } from '@/design-system/themes'

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  availableThemes: ThemeName[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// Apply default theme immediately to prevent flash
if (typeof window !== 'undefined') {
  applyDSTheme(defaultTheme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme)

  useEffect(() => {
    // Read persisted theme from localStorage
    const stored = localStorage.getItem('infiny-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const savedTheme = parsed.state?.settings?.theme
        if (savedTheme) {
          setThemeState(savedTheme)
          applyDSTheme(savedTheme)
        } else {
          applyDSTheme(defaultTheme)
        }
      } catch {
        applyDSTheme(defaultTheme)
      }
    } else {
      applyDSTheme(defaultTheme)
    }
  }, [])

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
    applyDSTheme(newTheme)
    // Persist to localStorage
    const stored = localStorage.getItem('infiny-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        parsed.state = parsed.state || {}
        parsed.state.settings = parsed.state.settings || {}
        parsed.state.settings.theme = newTheme
        localStorage.setItem('infiny-storage', JSON.stringify(parsed))
      } catch {
        // ignore
      }
    }
  }

  // During hydration, provide default theme to avoid mismatch
  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    availableThemes: ['pampas', 'dark-premium', 'tech-blue', 'natural-green', 'monochrome', 'futuristic'] as ThemeName[],
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}