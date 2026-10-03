'use client'

import React from 'react'
import { APP_CONFIG } from '@/lib/branding'

export default function Logo({ className = "w-6 h-6" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img 
      src={APP_CONFIG.logoPath} 
      alt={`${APP_CONFIG.name} Logo`} 
      className={`object-contain rounded-lg ${className}`} 
    />
  )
}
