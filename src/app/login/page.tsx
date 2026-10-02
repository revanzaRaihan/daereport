'use client'

import { useState, useEffect } from 'react'
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err === 'auth_callback_failed') {
        setErrorMsg('Gagal melakukan autentikasi dengan Google. Silakan coba lagi.')
      }
    }
  }, [])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      if (error) {
        setErrorMsg(error.message)
        setGoogleLoading(false)
      }
    } catch (err: any) {
      setErrorMsg('Gagal menghubungkan ke Google.')
      setGoogleLoading(false)
    }
  }

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
          setSuccessMsg(`Pendaftaran sukses untuk akun ${data.user.email}! Akun Anda sudah siap digunakan untuk masuk.`)
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

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full bg-white hover:bg-neutral-50 border border-black/15 text-neutral-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] text-sm shadow-none disabled:opacity-50 mb-5"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              <span className="font-mono text-xs uppercase tracking-wider">Menghubungkan...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span className="font-mono text-xs uppercase tracking-wider font-bold">Lanjutkan dengan Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-black/10 w-full"></div>
          <span className="bg-white px-3 text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
            atau dengan email
          </span>
          <div className="border-t border-black/10 w-full"></div>
        </div>

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
