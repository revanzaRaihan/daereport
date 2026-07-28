'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'
import { KeyRound, Mail, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setErrorMsg(error.message)
        } else if (data.user) {
          setSuccessMsg(`Pendaftaran sukses! UUID akun Anda: ${data.user.id}. Silakan salin UUID ini untuk menjalankan script SQL migrasi (supabase_migration.sql) di Supabase SQL Editor agar data lama Anda terhubung.`)
          // Clear inputs
          setEmail('')
          setPassword('')
          setIsSignUp(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setErrorMsg(
            error.message === 'Invalid login credentials'
              ? 'Email atau password salah. Pastikan Anda sudah mendaftar terlebih dahulu.'
              : error.message
          )
        } else {
          router.refresh()
          router.push('/')
        }
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-8 shadow-none relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-black rounded-xl text-white mb-4">
            <Logo className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-black tracking-tighter uppercase font-editorial-headline">Report Studio</h1>
          <p className="text-sm text-neutral-500 mt-2 font-sans">
            {isSignUp ? 'Daftar Akun Pengajar Baru' : 'Masuk ke Dashboard Laporan Progres Les'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-white border border-black text-black text-sm px-4 py-3 rounded-lg mb-6 shadow-none font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-white border border-black text-black text-xs px-4 py-3.5 rounded-lg mb-6 leading-relaxed select-all font-mono shadow-none">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 font-mono">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-white border border-black/10 rounded-xl py-3 pl-11 pr-4 text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black focus:shadow-[0_0_0_1px_#000000] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 font-mono">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-black/10 rounded-xl py-3 pl-11 pr-4 text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black focus:shadow-[0_0_0_1px_#000000] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold uppercase tracking-wider py-3 rounded-xl shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] text-sm font-mono"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk Sekarang'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg('')
              setSuccessMsg('')
            }}
            className="text-neutral-500 hover:text-black font-bold uppercase tracking-widest font-mono text-[10px] cursor-pointer underline"
          >
            {isSignUp ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar di sini'}
          </button>
        </div>
      </div>

      <div className="text-[10px] text-neutral-400 mt-8 relative z-10 font-mono uppercase tracking-widest">
        Report Studio &middot; Next.js + Supabase
      </div>
    </main>
  )
}
