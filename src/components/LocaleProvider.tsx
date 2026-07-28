'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { translations } from '@/lib/translations'

type Locale = 'id' | 'en'

interface LocaleContextProps {
  locale: Locale;
  setLocale: (loc: Locale) => Promise<void>;
  t: (key: keyof typeof translations['id']) => string;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined)

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id')
  const supabase = createClient()

  // 1. Sync from localStorage (fast sync) on mount
  useEffect(() => {
    const cached = localStorage.getItem('app_locale') as Locale
    if (cached === 'id' || cached === 'en') {
      setLocaleState(cached)
    }

    // 2. Sync from Supabase db (source of truth)
    const fetchDbLocale = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'app_locale').maybeSingle()
        if (data?.value === 'id' || data?.value === 'en') {
          setLocaleState(data.value as Locale)
          localStorage.setItem('app_locale', data.value)
        }
      } catch (e) {
        console.error('Failed to load locale setting', e)
      }
    }
    fetchDbLocale()
  }, [])

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('app_locale', newLocale)
    
    // Save to Supabase db
    try {
      await supabase.from('app_settings').upsert({ key: 'app_locale', value: newLocale })
    } catch (e) {
      console.error('Failed to save locale to database', e)
    }
  }

  const t = (key: keyof typeof translations['id']) => {
    return translations[locale]?.[key] || translations['id']?.[key] || String(key)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider')
  }
  return context
}
