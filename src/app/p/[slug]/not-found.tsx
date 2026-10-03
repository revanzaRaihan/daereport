import Link from 'next/link'
import { APP_CONFIG } from '@/lib/branding'
import { GraduationCap, ArrowLeft } from 'lucide-react'

export default function StudentNotFound() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-5 text-amber-700">
          <GraduationCap className="w-8 h-8" />
        </div>

        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono mb-1">
          Portal Wali Murid
        </p>

        <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">
          Data Murid Tidak Ditemukan
        </h1>

        <p className="text-sm text-neutral-600 leading-relaxed mb-6">
          Tautan rapor belajar yang Anda buka belum terdaftar atau telah diubah. Pastikan ejaan nama pada tautan sudah benar atau hubungi admin/guru pembimbing Anda.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
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
