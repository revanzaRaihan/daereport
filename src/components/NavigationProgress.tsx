'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { prefetchRouteData } from '@/lib/dataCache'

interface NavigationProgressContextType {
  start: () => void
  done: () => void
  navigate: (href: string) => Promise<void>
  isNavigating: boolean
}

const NavigationProgressContext = createContext<NavigationProgressContextType>({
  start: () => {},
  done: () => {},
  navigate: async () => {},
  isNavigating: false,
})

export function useNavigationProgress() {
  return useContext(NavigationProgressContext)
}

export default function NavigationProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const doneTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activePathRef = useRef(pathname)

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    }
  }, [])

  const start = useCallback(() => {
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    if (timerRef.current) clearInterval(timerRef.current)

    setIsNavigating(true)
    setVisible(true)
    setProgress(15)

    // Smooth incremental trickle: creeps forward up to 85%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current)
          return prev
        }
        const step = Math.max(1, (85 - prev) * 0.15)
        return Math.min(85, prev + step)
      })
    }, 120)
  }, [])

  const done = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(100)

    doneTimerRef.current = setTimeout(() => {
      setVisible(false)
      setIsNavigating(false)
      doneTimerRef.current = setTimeout(() => {
        setProgress(0)
      }, 200)
    }, 250)
  }, [])

  // Auto-complete progress when pathname finishes changing
  useEffect(() => {
    if (pathname !== activePathRef.current) {
      activePathRef.current = pathname
      done()
    }
  }, [pathname, done])

  // Smart navigate: pre-fetches destination data before switching pages
  const navigate = useCallback(async (href: string) => {
    if (pathname === href) return

    start()

    try {
      // 1. Prefetch destination data with safety timeout so app never stalls
      const prefetchPromise = prefetchRouteData(href, supabase)
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1000))
      await Promise.race([prefetchPromise, timeoutPromise])

      // 2. Perform route transition once data is ready in memory
      router.push(href)
    } catch (e) {
      console.error('Navigation error:', e)
      router.push(href)
    }
  }, [pathname, router, supabase, start])

  return (
    <NavigationProgressContext.Provider value={{ start, done, navigate, isNavigating }}>
      {/* Top Navigation Progress Bar */}
      <div
        aria-hidden={!visible}
        className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3px] overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 250ms ease-in-out',
        }}
      >
        <div
          className="h-full bg-accent relative"
          style={{
            width: `${progress}%`,
            transition: progress === 100 
              ? 'width 180ms ease-out' 
              : 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 10px #4da23c, 0 0 4px #4da23c',
          }}
        >
          {/* Glowing leading light */}
          <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-white/40 to-white/90 blur-[1px]" />
        </div>
      </div>

      {children}
    </NavigationProgressContext.Provider>
  )
}
