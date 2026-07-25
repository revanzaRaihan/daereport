'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Settings, 
  Save, 
  Loader2, 
  Check, 
  X, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Key,
  Smartphone,
  Languages
} from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()

  // Loaders & Alert states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Settings form states
  const [provider, setProvider] = useState('gemini')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [apiKey, setApiKey] = useState('')
  const [maskedKey, setMaskedKey] = useState('')
  const [waNumber, setWaNumber] = useState('')
  const [locale, setLocale] = useState('id')

  // UI States
  const [showKey, setShowKey] = useState(false)
  const [keyModified, setKeyModified] = useState(false)

  // Fetch Settings
  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('app_settings').select('key, value')
      if (data) {
        const settingsMap = new Map(data.map(item => [item.key, item.value]))
        
        const prov = settingsMap.get('ai_provider') || 'gemini'
        const md = settingsMap.get('ai_model') || (prov === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.1-8b-instant')
        const keyVal = settingsMap.get('ai_api_key') || ''
        const wa = settingsMap.get('admin_wa_number') || ''
        const loc = settingsMap.get('app_locale') || 'id'

        setProvider(prov)
        setModel(md)
        setWaNumber(wa)
        setLocale(loc)

        // Setup masked key
        if (keyVal) {
          const masked = keyVal.length > 8 
            ? `${keyVal.substring(0, 4)}${'*'.repeat(keyVal.length - 8)}${keyVal.substring(keyVal.length - 4)}` 
            : '*'.repeat(keyVal.length)
          setApiKey(masked)
          setMaskedKey(masked)
        } else {
          setApiKey('')
          setMaskedKey('')
        }
        setKeyModified(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleKeyChange = (val: string) => {
    setApiKey(val)
    setKeyModified(true)
  }

  const triggerToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(''), 4000)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // Build upsert payload
      const upserts = [
        { key: 'ai_provider', value: provider },
        { key: 'ai_model', value: model },
        { key: 'admin_wa_number', value: waNumber },
        { key: 'app_locale', value: locale }
      ]

      // Only upsert API Key if it's been edited and doesn't contain asterisks (which would be the masked placeholder)
      if (keyModified && !apiKey.includes('*')) {
        upserts.push({ key: 'ai_api_key', value: apiKey.trim() })
      } else if (keyModified && !apiKey.trim()) {
        // If cleared to empty, save empty string to remove it
        upserts.push({ key: 'ai_api_key', value: '' })
      }

      const { error } = await supabase.from('app_settings').upsert(upserts)
      if (error) throw error

      triggerToast('success', 'Pengaturan AI dan sistem berhasil disimpan.')
      fetchSettings()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  const modelOptions = provider === 'gemini' 
    ? [
        { label: 'Gemini 2.5 Flash (Default)', value: 'gemini-2.5-flash' },
        { label: 'Gemini 2.5 Pro (Lebih Pintar / Lambat)', value: 'gemini-2.5-pro' },
        { label: 'Gemini 1.5 Flash (Legacy)', value: 'gemini-1.5-flash' }
      ]
    : [
        { label: 'Llama 3.1 8B Instant (Default)', value: 'llama-3.1-8b-instant' },
        { label: 'Llama 3 8B (Legacy)', value: 'llama3-8b-8192' },
        { label: 'Llama 3.1 70B (Lebih Pintar)', value: 'llama-3.1-70b-versatile' }
      ]

  const handleProviderChange = (prov: string) => {
    setProvider(prov)
    setModel(prov === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.1-8b-instant')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-400" />
          Pengaturan
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Konfigurasi penyedia AI (Gemini/Groq), API Key, dan preferensi aplikasi.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl flex gap-2">
          <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl flex gap-2">
          <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
          
          {/* AI Settings Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
              <Sparkles className="w-4 h-4" />
              Kredensial Kecerdasan Buatan (AI)
            </h3>

            {/* Provider Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Penyedia Model AI (Provider)
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="gemini">Google Gemini AI</option>
                <option value="groq">Groq Cloud API</option>
              </select>
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Model AI yang Digunakan
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {modelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Kredensial API Key ini disimpan aman di database server Supabase Anda dan tidak pernah dipublikasikan keluar.
              </p>
            </div>
          </div>

          {/* System settings Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
              <Languages className="w-4 h-4" />
              Sistem & Kontak
            </h3>

            {/* Locale */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Bahasa Default Dashboard
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* WA Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Nomor WhatsApp Admin Guru
              </label>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Contoh: 628123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                Nomor ini digunakan untuk mengirimkan salinan laporan progres murid langsung via WA.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>

        </form>
      )}
    </div>
  )
}
