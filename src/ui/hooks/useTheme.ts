import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

const resolveInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }
  try {
    const saved = window.localStorage.getItem('ariba-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch { /* ignore storage access errors */ }

  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch { /* matchMedia may be unavailable */ }

  return 'light'
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())

  useEffect(() => {
    // Appliquer le thème au document
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    const body = document.body
    
    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }
    
    // Sauvegarder dans localStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ariba-theme', theme)
      }
    } catch { /* ignore storage write errors */ }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')

  return {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }
}
