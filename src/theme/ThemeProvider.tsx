import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type ThemeName, defaultTheme, applyThemeToDOM } from './themes'
import { useStore } from '@/store/infinyStore'

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  availableThemes: ThemeName[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useStore()
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Read persisted theme from localStorage (zustand persist)
    const stored = localStorage.getItem('infiny-storage')
    let savedTheme: ThemeName | null = null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        savedTheme = parsed.state?.settings?.theme ?? null
      } catch {
        // ignore
      }
    }
    const initialTheme = savedTheme ?? defaultTheme
    setThemeState(initialTheme)
    applyThemeToDOM(initialTheme)
    setHydrated(true)
  }, [])

  // Sync with store when settings change
  useEffect(() => {
    if (hydrated && settings.theme !== theme) {
      setThemeState(settings.theme)
      applyThemeToDOM(settings.theme)
    }
  }, [settings.theme, hydrated])

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
    applyThemeToDOM(newTheme)
    // Persist to store (which persists to localStorage via zustand middleware)
    updateSettings({ theme: newTheme })
  }

  // During hydration, provide default theme to avoid mismatch
  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    availableThemes: ['turtly-light', 'turtly-forest', 'pampas', 'dark-premium', 'tech-blue', 'natural-green', 'monochrome', 'futuristic'] as ThemeName[],
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