import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { themes, type ThemeName, type ThemeTokens, applyThemeToDOM, defaultTheme } from './themes'

interface ThemeContextValue {
  theme: ThemeName
  tokens: ThemeTokens
  setTheme: (theme: ThemeName) => void
  availableThemes: ThemeName[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  const tokens = useMemo(() => themes[theme], [theme])

  useEffect(() => {
    setMounted(true)
    // Ler do localStorage (persistido pelo Zustand)
    const stored = localStorage.getItem('infiny-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.state?.settings?.theme) {
          setThemeState(parsed.state.settings.theme)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
    applyThemeToDOM(newTheme)
    // Persistir no localStorage
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

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, tokens, setTheme, availableThemes: Object.keys(themes) as ThemeName[] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}