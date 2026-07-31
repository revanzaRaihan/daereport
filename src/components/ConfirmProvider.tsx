'use client'

import React, { createContext, useContext, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useTranslation } from './LocaleProvider'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
    setLoading(false)
  }

  const handleClose = () => {
    if (loading) return
    setIsOpen(false)
    setOptions(null)
  }

  const handleConfirm = async () => {
    if (!options) return
    setLoading(true)
    try {
      await options.onConfirm()
      handleClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-black/10 rounded-2xl p-6 shadow-none relative animate-scale-up">
            <button 
              onClick={handleClose}
              disabled={loading}
              className="absolute right-4 top-4 text-neutral-400 hover:text-black p-1 rounded-lg disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
                  {options.title || t('confirm_title') || 'Konfirmasi'}
                </h4>
                <p className="text-xs text-neutral-550 max-w-[250px] leading-relaxed">
                  {options.message}
                </p>
              </div>

              <div className="pt-4 flex w-full gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 bg-white border border-black/10 hover:bg-neutral-100 text-black font-semibold py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono disabled:opacity-50"
                >
                  {options.cancelText || t('btn_cancel') || 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-none cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    options.confirmText || t('btn_delete') || 'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
