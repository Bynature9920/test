import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Apply theme class whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      // Apply immediately to HTML element
      if (typeof document !== 'undefined') {
        const html = document.documentElement
        html.classList.remove('light', 'dark')
        html.classList.add(newTheme)
        localStorage.setItem('theme', newTheme)
        // Force a repaint
        void html.offsetHeight
      }
      return newTheme
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
