'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextProps {
  isDark: boolean;
  toggleTheme: (event: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const cached = localStorage.getItem('app_theme')
    const darkTheme = cached === 'dark' || (!cached && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (darkTheme) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
    setMounted(true)
  }, [])

  const toggleTheme = (event: React.MouseEvent) => {
    const nextDark = !isDark

    // If browser doesn't support View Transitions API
    if (!document.startViewTransition) {
      setIsDark(nextDark)
      localStorage.setItem('app_theme', nextDark ? 'dark' : 'light')
      if (nextDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      setIsDark(nextDark)
      localStorage.setItem('app_theme', nextDark ? 'dark' : 'light')
      if (nextDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ]
      document.documentElement.animate(
        {
          clipPath: nextDark ? clipPath : [...clipPath].reverse()
        },
        {
          duration: 450,
          easing: 'ease-in-out',
          pseudoElement: nextDark ? '::view-transition-new(root)' : '::view-transition-old(root)'
        }
      )
    })
  }

  // Prevent hydration mismatch layout flickers
  return (
    <ThemeContext.Provider value={{ isDark: mounted ? isDark : false, toggleTheme }}>
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
