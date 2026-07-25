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
      {/* Primary Content Header (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h2>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-sm font-medium text-slate-500">Konfigurasi</span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-100 text-green-800 text-xs px-4 py-3 rounded-2xl flex gap-2.5 shadow-card font-medium">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded-2xl flex gap-2.5 shadow-card font-medium">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-card transition-all duration-200 hover:border-blue-200">
          
          {/* AI Settings Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4" />
              Kredensial Kecerdasan Buatan (AI)
            </h3>

            {/* Provider Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Penyedia Model AI (Provider)
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
              >
                <option value="gemini">Google Gemini AI</option>
                <option value="groq">Groq Cloud API</option>
              </select>
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Model AI yang Digunakan
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
              >
                {modelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-4 pr-12 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                Kredensial API Key ini disimpan aman di database server Supabase Anda dan tidak pernah dipublikasikan keluar.
              </p>
            </div>
          </div>

          {/* System settings Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Languages className="w-4 h-4" />
              Sistem & Kontak
            </h3>

            {/* Locale */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Bahasa Default Dashboard
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* WA Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Nomor WhatsApp Admin Guru
              </label>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Contoh: 628123456789"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Nomor ini digunakan untuk mengirimkan salinan laporan progres murid langsung via WA.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md shadow-blue-200/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>

        </form>
      )}
    </div>
  )
}
