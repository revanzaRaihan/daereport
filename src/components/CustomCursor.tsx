'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const mousePos = useRef({ x: -100, y: -100 })
  const cursorPos = useRef({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        const isInteractive = 
          target.closest('a') || 
          target.closest('button') || 
          target.closest('[role="button"]') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('.interactive-cursor')
        
        setIsHovered(!!isInteractive)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    let rafId: number
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end

    const tick = () => {
      if (cursorRef.current) {
        // Initialize position on first move to prevent starting from (0,0)
        if (cursorPos.current.x === -100 && mousePos.current.x !== -100) {
          cursorPos.current.x = mousePos.current.x
          cursorPos.current.y = mousePos.current.y
        } else {
          cursorPos.current.x = lerp(cursorPos.current.x, mousePos.current.x, 0.15)
          cursorPos.current.y = lerp(cursorPos.current.y, mousePos.current.y, 0.15)
        }
        
        cursorRef.current.style.transform = `translate3d(${cursorPos.current.x - 16}px, ${cursorPos.current.y - 16}px, 0) scale(${isHovered ? 2.5 : 1})`
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(rafId)
    }
  }, [isHovered, isVisible])

  return (
    <div
      ref={cursorRef}
      className={`
        fixed top-0 left-0 w-8 h-8 rounded-full border border-black bg-white pointer-events-none z-[9999]
        mix-blend-difference transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        transform: 'translate3d(-100px, -100px, 0)',
        willChange: 'transform',
      }}
    />
  )
}
