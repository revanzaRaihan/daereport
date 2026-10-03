'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { APP_CONFIG } from '@/lib/branding'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log unexpected runtime error
    console.error('Unhandled runtime error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-black/10 flex items-center justify-center mx-auto mb-5 text-neutral-800">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono mb-1">
          Terjadi Kesalahan Sistem
        </p>

        <h1 className="text-xl font-bold text-black uppercase tracking-wider font-mono mb-3">
          Sesuatu Tidak Berjalan Semestinya
        </h1>

        <p className="text-sm text-neutral-500 leading-relaxed mb-6">
          Sistem mengalami kendala saat memproses data. Anda dapat mencoba memuat ulang aksi sebelumnya atau kembali ke beranda.
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 w-full bg-black hover:bg-neutral-800 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-white border border-black/10 hover:bg-neutral-100 text-black font-semibold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <p className="text-[11px] text-neutral-400 font-mono mt-6">
          {APP_CONFIG.name}
        </p>
      </div>
    </div>
  )
}
