'use client'

import React from 'react'

export default function Logo({ className = "w-6 h-6" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img 
      src="/logo.png" 
      alt="Report Studio Logo" 
      className={`object-contain rounded-lg ${className}`} 
    />
  )
}
