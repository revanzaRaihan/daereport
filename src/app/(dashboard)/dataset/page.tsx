'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import CustomSelect from '@/components/CustomSelect'
import { useTranslation } from '@/components/LocaleProvider'
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  X,
  Sparkles,
  Info,
  HelpCircle,
  Eye
} from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview Laporan',
  teachers_note: "Catatan Guru (Teacher's Note)",
  parent_note: 'Catatan Orang Tua (Parent Note)'
}

const CATEGORY_LABELS: Record<string, string> = {
  kreativitas: 'Kreativitas',
  logika_terstruktur: 'Logika Terstruktur',
  eksperimen: 'Eksperimen',
  coding_dasar: 'Coding Dasar'
}

export default function DatasetPage() {
  const supabase = createClient()
  const { t, locale } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'styles' | 'recommendations'>('styles')

  // Loaders & Alerts
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Data States
  const [styles, setStyles] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])

  // Filters
  const [filterLang, setFilterLang] = useState<'id' | 'en'>('id')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Styles Form States
  const [styleLang, setStyleLang] = useState<'id' | 'en'>('id')
  const [styleSection, setStyleSection] = useState<'overview' | 'teachers_note' | 'parent_note'>('overview')
  const [styleBody, setStyleBody] = useState('')

  // Recommendations Form States
  const [recLang, setRecLang] = useState<'id' | 'en'>('id')
  const [recCategory, setRecCategory] = useState<'kreativitas' | 'logika_terstruktur' | 'eksperimen' | 'coding_dasar'>('coding_dasar')
  const [recBody, setRecBody] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // 1. Fetch Styles
        const { data: stylesData } = await supabase
          .from('dataset_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setStyles(stylesData || [])

        // 2. Fetch Recommendations
        const { data: recData } = await supabase
          .from('recommendation_datasets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setRecommendations(recData || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const triggerToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(''), 4000)
    }
  }

  // Submit Writing Style Example
  const handleStyleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!styleBody.trim()) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('dataset_entries')
        .insert({
          language: styleLang,
          section_type: styleSection,
          body: styleBody.trim(),
          user_id: userId
        })

      if (error) throw error

      triggerToast('success', 'Contoh gaya penulisan berhasil ditambahkan.')
      setStyleBody('')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menyimpan contoh gaya.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Style Example
  const handleDeleteStyle = async (id: string) => {
    if (!confirm('Hapus contoh gaya penulisan ini?')) return
    try {
      const { error } = await supabase.from('dataset_entries').delete().eq('id', id)
      if (error) throw error
      triggerToast('success', 'Contoh gaya berhasil dihapus.')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menghapus contoh.')
    }
  }

  // Submit Recommendation
  const handleRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recBody.trim()) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('recommendation_datasets')
        .insert({
          language: recLang,
          category: recCategory,
          body: recBody.trim(),
          user_id: userId
        })

      if (error) throw error

      triggerToast('success', 'Rekomendasi latihan berhasil ditambahkan.')
      setRecBody('')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menyimpan rekomendasi.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Recommendation
  const handleDeleteRec = async (id: string) => {
    if (!confirm('Hapus rekomendasi latihan ini?')) return
    try {
      const { error } = await supabase.from('recommendation_datasets').delete().eq('id', id)
      if (error) throw error
      triggerToast('success', 'Rekomendasi berhasil dihapus.')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menghapus rekomendasi.')
    }
  }

  // Filter lists
  const filteredStyles = styles.filter(s => {
    const matchLang = s.language === filterLang
    const matchSec = filterSection === 'all' || s.section_type === filterSection
    return matchLang && matchSec
  })

  const filteredRecs = recommendations.filter(r => {
    const matchLang = r.language === filterLang
    const matchCat = filterCategory === 'all' || r.category === filterCategory
    return matchLang && matchCat
  })

  const getSectionLabel = (sec: string) => {
    if (locale === 'id') {
      return SECTION_LABELS[sec] || sec
    }
    const map: Record<string, string> = {
      overview: 'Overview',
      teachers_note: "Teacher's Note",
      parent_note: "Parent's Note"
    }
    return map[sec] || sec
  }

  const getCategoryLabel = (cat: string) => {
    if (locale === 'id') {
      return CATEGORY_LABELS[cat] || cat
    }
    const map: Record<string, string> = {
      coding_dasar: 'Basic Coding',
      logika_terstruktur: 'Structured Logic',
      kreativitas: 'Creativity',
      eksperimen: 'Experimentation'
    }
    return map[cat] || cat
  }

  return (
    <div className="space-y-6">
      {/* Primary Content Header (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-black tracking-tighter uppercase font-editorial-headline">{t('dataset_title')}</h2>
          <div className="h-4 w-px bg-black/10" />
          <span className="text-xs font-medium text-neutral-500 font-mono tracking-wider">
            {activeTab === 'styles' 
              ? `${styles.length} ${locale === 'id' ? 'Contoh Gaya' : 'Style Examples'}` 
              : `${recommendations.length} ${locale === 'id' ? 'Rekomendasi' : 'Recommendations'}`}
          </span>
        </div>

        {/* Tab Selection */}
        <div className="bg-neutral-100 border border-black/5 p-1 rounded-xl flex gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'styles' ? 'bg-black text-white font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            {locale === 'id' ? 'Gaya Laporan' : 'Report Style'}
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recommendations' ? 'bg-black text-white font-bold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            {t('tab_recs')}
          </button>
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

      {/* Description Box */}
      <div className="bg-white border border-black text-black rounded-2xl p-5 flex gap-3.5 items-start shadow-none">
        <div className="p-2 bg-black rounded-xl text-white border border-transparent shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="font-extrabold text-black text-sm">{locale === 'id' ? 'Bagaimana ini bekerja?' : 'How does this work?'}</p>
          <p className="text-xs text-neutral-550 leading-relaxed font-medium">
            {locale === 'id'
              ? 'AI tidak menggunakan template kaku. AI akan meneliti contoh-contoh gaya bahasa, diksi, dan rekomendasi latihan yang Anda daftarkan di bawah ini. Ketika Anda men-generate laporan, AI akan menirunya (few-shot learning) agar hasilnya sangat natural mirip buatan Anda sendiri.'
              : 'The AI does not use rigid templates. It learns from the writing styles, diction, and practice recommendations you register below. When you generate a report, the AI copies them (few-shot learning) so results match your natural writing style.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Input Form Column (1/3 width) */}
          <section className="bg-white border border-black/10 rounded-2xl p-6 space-y-6 shadow-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/30">
            <h2 className="text-sm font-bold text-black flex items-center gap-2 pb-3 border-b border-black/10 font-mono uppercase tracking-wider">
              <Plus className="w-4 h-4 text-black" />
              <span>{activeTab === 'styles' ? t('btn_add_style') : t('btn_add_rec')}</span>
            </h2>

            {activeTab === 'styles' ? (
              <form onSubmit={handleStyleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_lang')}
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'id', label: locale === 'id' ? 'Bahasa Indonesia' : 'Indonesian' },
                      { value: 'en', label: locale === 'id' ? 'Bahasa Inggris (English)' : 'English' }
                    ]}
                    value={styleLang}
                    onChange={(val) => setStyleLang(val as 'id' | 'en')}
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_section')}
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'overview', label: locale === 'id' ? 'Overview Laporan' : 'Report Overview' },
                      { value: 'teachers_note', label: locale === 'id' ? "Catatan Guru (Teacher's Note)" : "Teacher's Note" },
                      { value: 'parent_note', label: locale === 'id' ? 'Catatan Orang Tua (Parent Note)' : "Parent's Note" }
                    ]}
                    value={styleSection}
                    onChange={(val) => setStyleSection(val as any)}
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_style_body')}
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={styleBody}
                    onChange={(e) => setStyleBody(e.target.value)}
                    placeholder={locale === 'id' ? 'Masukkan paragraf contoh laporan yang pernah Anda tulis secara manual sebelumnya...' : 'Enter a paragraph of a report you wrote manually in the past...'}
                    className="form-textarea-premium font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !styleBody.trim()}
                  className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-none flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] font-mono"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t('btn_save_style')}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_lang')}
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'id', label: locale === 'id' ? 'Bahasa Indonesia' : 'Indonesian' },
                      { value: 'en', label: locale === 'id' ? 'Bahasa Inggris (English)' : 'English' }
                    ]}
                    value={recLang}
                    onChange={(val) => setRecLang(val as 'id' | 'en')}
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_rec_category')}
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'coding_dasar', label: locale === 'id' ? 'Coding Dasar' : 'Basic Coding' },
                      { value: 'logika_terstruktur', label: locale === 'id' ? 'Logika Terstruktur' : 'Structured Logic' },
                      { value: 'kreativitas', label: locale === 'id' ? 'Kreativitas' : 'Creativity' },
                      { value: 'eksperimen', label: locale === 'id' ? 'Eksperimen' : 'Experimentation' }
                    ]}
                    value={recCategory}
                    onChange={(val) => setRecCategory(val as any)}
                    isSearchable={false}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_rec_body')}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={recBody}
                    onChange={(e) => setRecBody(e.target.value)}
                    placeholder={locale === 'id' ? 'Format persis wajib seperti:\n1. Kodable: https://studio.kodable.com' : 'Exact format required like:\n1. Kodable: https://studio.kodable.com'}
                    className="form-textarea-premium font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !recBody.trim()}
                  className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-none flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] font-mono"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t('btn_save_rec')}</span>
                </button>
              </form>
            )}
          </section>

          {/* List Column (2/3 width) */}
          <section className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-6 space-y-5 shadow-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/30">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-black/10 pb-4">
              <h2 className="text-sm font-bold text-black flex items-center gap-2 font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-black animate-pulse" />
                <span>{locale === 'id' ? 'Daftar Contoh' : 'Example List'} ({activeTab === 'styles' ? filteredStyles.length : filteredRecs.length})</span>
              </h2>

              <div className="flex items-center gap-2">
                {/* Language Filter */}
                <CustomSelect
                  options={[
                    { value: 'id', label: locale === 'id' ? 'Indo (ID)' : 'Indonesian' },
                    { value: 'en', label: locale === 'id' ? 'English (EN)' : 'English' }
                  ]}
                  value={filterLang}
                  onChange={(val) => setFilterLang(val as any)}
                  isSearchable={false}
                  className="min-w-[120px]"
                />

                {/* Section Filter (Only for styles tab) */}
                {activeTab === 'styles' ? (
                  <CustomSelect
                    options={[
                      { value: 'all', label: locale === 'id' ? 'Semua Bagian' : 'All Sections' },
                      { value: 'overview', label: 'Overview' },
                      { value: 'teachers_note', label: locale === 'id' ? 'Catatan Guru' : "Teacher's Note" },
                      { value: 'parent_note', label: locale === 'id' ? 'Catatan Orang Tua' : "Parent's Note" }
                    ]}
                    value={filterSection}
                    onChange={(val) => setFilterSection(val)}
                    isSearchable={false}
                    className="min-w-[150px]"
                  />
                ) : (
                  // Category Filter (Only for recs tab)
                  <CustomSelect
                    options={[
                      { value: 'all', label: locale === 'id' ? 'Semua Kategori' : 'All Categories' },
                      { value: 'coding_dasar', label: locale === 'id' ? 'Coding Dasar' : 'Basic Coding' },
                      { value: 'logika_terstruktur', label: locale === 'id' ? 'Logika Terstruktur' : 'Structured Logic' },
                      { value: 'kreativitas', label: locale === 'id' ? 'Kreativitas' : 'Creativity' },
                      { value: 'eksperimen', label: locale === 'id' ? 'Eksperimen' : 'Experimentation' }
                    ]}
                    value={filterCategory}
                    onChange={(val) => setFilterCategory(val)}
                    isSearchable={false}
                    className="min-w-[180px]"
                  />
                )}
              </div>
            </div>

            {/* Content List */}
            {activeTab === 'styles' ? (
              filteredStyles.length === 0 ? (
                <div className="border border-dashed border-black/10 rounded-2xl p-12 text-center text-neutral-400">
                  <Eye className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="font-bold text-black text-sm font-mono uppercase tracking-wider">
                    {locale === 'id' ? 'Tidak Ada Contoh Gaya Ditemukan' : 'No Style Examples Found'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {locale === 'id' 
                      ? 'Gunakan form di sebelah kiri untuk menambahkan contoh baru.' 
                      : 'Use the form on the left to add a new example.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredStyles.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-black/10 rounded-xl p-4 space-y-3 relative hover:border-black/20 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-black border border-transparent text-white text-[9px] font-extrabold uppercase tracking-widest rounded-xl font-mono">
                          {getSectionLabel(item.section_type)}
                        </span>
                        <button
                          onClick={() => handleDeleteStyle(item.id)}
                          className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title={t('btn_delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-black leading-relaxed font-mono whitespace-pre-wrap font-medium bg-neutral-50 p-3 rounded-lg border border-black/5">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredRecs.length === 0 ? (
                <div className="border border-dashed border-black/10 rounded-2xl p-12 text-center text-neutral-400">
                  <Eye className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="font-bold text-black text-sm font-mono uppercase tracking-wider">
                    {locale === 'id' ? 'Tidak Ada Rekomendasi Ditemukan' : 'No Recommendations Found'}
                  </p>
                  <p className="text-xs text-neutral-550 mt-1">
                    {locale === 'id' 
                      ? 'Gunakan form di sebelah kiri untuk menambahkan rekomendasi baru.' 
                      : 'Use the form on the left to add a new recommendation.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredRecs.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-black/10 rounded-xl p-4 space-y-3 relative hover:border-black/20 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-black border border-transparent text-white text-[9px] font-extrabold uppercase tracking-widest rounded-xl font-mono">
                          {locale === 'id' ? 'Kategori' : 'Category'}: {getCategoryLabel(item.category)}
                        </span>
                        <button
                          onClick={() => handleDeleteRec(item.id)}
                          className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title={t('btn_delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-black leading-relaxed font-mono whitespace-pre-wrap font-medium bg-neutral-50 p-3 rounded-lg border border-black/5">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        </div>
      )}
    </div>
  )
}
