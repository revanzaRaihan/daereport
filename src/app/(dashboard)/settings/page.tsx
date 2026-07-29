'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import CustomSelect from '@/components/CustomSelect'
import { useTranslation } from '@/components/LocaleProvider'
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
  const { t, locale: currentLocale, setLocale: updateGlobalLocale } = useTranslation()

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

      await updateGlobalLocale(locale as 'id' | 'en')
      triggerToast('success', t('msg_settings_saved'))
      fetchSettings()
    } catch (err: any) {
      triggerToast('error', err.message || t('msg_settings_failed'))
    } finally {
      setSaving(false)
    }
  }

  const modelOptions = provider === 'gemini' 
    ? [
        { label: 'Gemini 3.6 Flash', value: 'gemini-3.6-flash' },
        { label: 'Gemini 3.5 Flash', value: 'gemini-3.5-flash' },
        { label: 'Gemini 3.5 Flash Lite', value: 'gemini-3.5-flash-lite' },
        { label: 'Gemini 3.1 Flash Lite', value: 'gemini-3.1-flash-lite' },
        { label: 'Gemini 3 Flash', value: 'gemini-3-flash' },
        { label: 'Gemini 2.5 Flash (Default)', value: 'gemini-2.5-flash' },
        { label: currentLocale === 'id' ? 'Gemini 2.5 Pro (Lebih Pintar / Lambat)' : 'Gemini 2.5 Pro (Smarter / Slower)', value: 'gemini-2.5-pro' },
        { label: 'Gemini 2.5 Flash Lite', value: 'gemini-2.5-flash-lite' },
        { label: 'Gemini 1.5 Flash (Legacy)', value: 'gemini-1.5-flash' }
      ]
    : [
        { label: 'Llama 3.1 8B Instant (Default)', value: 'llama-3.1-8b-instant' },
        { label: 'Llama 3 8B (Legacy)', value: 'llama3-8b-8192' },
        { label: currentLocale === 'id' ? 'Llama 3.1 70B (Lebih Pintar)' : 'Llama 3.1 70B (Smarter)', value: 'llama-3.1-70b-versatile' }
      ]

  const handleProviderChange = (prov: string) => {
    setProvider(prov)
    setModel(prov === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.1-8b-instant')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Primary Content Header (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-black tracking-tighter uppercase font-editorial-headline">{t('settings_title')}</h2>
          <div className="h-4 w-px bg-black/10" />
          <span className="text-xs font-medium text-neutral-500 font-mono tracking-wider">{t('settings_subtitle')}</span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-white border border-black text-black text-xs px-4 py-3 rounded-2xl flex gap-2.5 shadow-none font-medium">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-white border border-black text-black text-xs px-4 py-3 rounded-2xl flex gap-2.5 shadow-none font-bold">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white border border-black/10 rounded-2xl p-6 space-y-6 shadow-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/30">
          
          {/* AI Settings Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-black/10 font-mono">
              <Sparkles className="w-4 h-4" />
              {t('settings_sec_ai')}
            </h3>

            {/* Provider Select */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                {t('label_provider')}
              </label>
              <CustomSelect
                options={[
                  { value: 'gemini', label: 'Google Gemini AI' },
                  { value: 'groq', label: 'Groq Cloud API' }
                ]}
                value={provider}
                onChange={handleProviderChange}
                isSearchable={false}
              />
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                {t('label_model')}
              </label>
              <CustomSelect
                options={modelOptions}
                value={model}
                onChange={(val) => setModel(val)}
                isSearchable={false}
              />
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-neutral-400" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                  className="form-input-premium pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-neutral-550 mt-1.5 leading-relaxed font-medium">
                {currentLocale === 'id' 
                  ? 'Kredensial API Key ini disimpan aman di database server Supabase Anda dan tidak pernah dipublikasikan keluar.' 
                  : 'This API Key is stored securely in your Supabase database and is never exposed publicly.'}
              </p>
            </div>
          </div>

          {/* System settings Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-black/10 font-mono">
              <Languages className="w-4 h-4" />
              {t('settings_sec_system')}
            </h3>

            {/* Locale */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                {t('label_locale')}
              </label>
              <CustomSelect
                options={[
                  { value: 'id', label: currentLocale === 'id' ? 'Bahasa Indonesia' : 'Indonesian' },
                  { value: 'en', label: 'English' }
                ]}
                value={locale}
                onChange={(val) => setLocale(val)}
                isSearchable={false}
              />
            </div>

            {/* WA Number */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">
                <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                {t('label_wa')}
              </label>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Contoh: 628123456789"
                className="form-input-premium"
              />
              <p className="text-[10px] text-neutral-555 mt-1.5 font-medium">
                {currentLocale === 'id'
                  ? 'Nomor ini digunakan untuk mengirimkan salinan laporan progres murid langsung via WA.'
                  : 'This number is used to send student progress report copies directly via WhatsApp.'}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{currentLocale === 'id' ? 'Menyimpan Pengaturan...' : 'Saving Settings...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{currentLocale === 'id' ? 'Simpan Pengaturan' : 'Save Settings'}</span>
              </>
            )}
          </button>

        </form>
      )}
    </div>
  )
}
