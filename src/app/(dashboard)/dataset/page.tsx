'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            Dataset Gaya & Latihan
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Few-shot training: Tambahkan contoh gaya penulisan agar kecerdasan AI sesuai dengan karakter Anda.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1 text-sm font-medium self-start sm:self-center">
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'styles' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gaya Teks Laporan
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recommendations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rekomendasi Game
          </button>
        </div>
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

      {/* Description Box */}
      <div className="bg-indigo-500/5 border border-indigo-500/10 text-slate-300 text-xs p-4 rounded-xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-slate-200 text-sm">Bagaimana ini bekerja?</p>
          <p className="leading-relaxed">
            AI tidak menggunakan template kaku. AI akan meneliti contoh-contoh gaya bahasa, diksi, dan rekomendasi latihan yang Anda daftarkan di bawah ini. Ketika Anda men-generate laporan, AI akan menirunya (few-shot learning) agar hasilnya sangat natural mirip buatan Anda sendiri.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Input Form Column (1/3 width) */}
          <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <Plus className="w-5 h-5 text-indigo-400" />
              {activeTab === 'styles' ? 'Tambah Gaya Bahasa' : 'Tambah Rekomendasi'}
            </h2>

            {activeTab === 'styles' ? (
              <form onSubmit={handleStyleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Bahasa
                  </label>
                  <select
                    value={styleLang}
                    onChange={(e) => setStyleLang(e.target.value as 'id' | 'en')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">Bahasa Inggris (English)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Bagian Laporan (Section)
                  </label>
                  <select
                    value={styleSection}
                    onChange={(e) => setStyleSection(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="overview">Overview Laporan</option>
                    <option value="teachers_note">Catatan Guru (Teacher's Note)</option>
                    <option value="parent_note">Catatan Orang Tua (Parent Note)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Contoh Teks Laporan
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={styleBody}
                    onChange={(e) => setStyleBody(e.target.value)}
                    placeholder="Masukkan paragraf contoh laporan yang pernah Anda tulis secara manual sebelumnya..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !styleBody.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-sm active:scale-[0.99]"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Contoh Gaya</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Bahasa
                  </label>
                  <select
                    value={recLang}
                    onChange={(e) => setRecLang(e.target.value as 'id' | 'en')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">Bahasa Inggris (English)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Kategori Latihan
                  </label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="coding_dasar">Coding Dasar</option>
                    <option value="logika_terstruktur">Logika Terstruktur</option>
                    <option value="kreativitas">Kreativitas</option>
                    <option value="eksperimen">Eksperimen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Contoh Teks Rekomendasi Game
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={recBody}
                    onChange={(e) => setRecBody(e.target.value)}
                    placeholder="Format persis wajib seperti:&#13;1. Kodable: https://studio.kodable.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !recBody.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-sm active:scale-[0.99]"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Rekomendasi</span>
                </button>
              </form>
            )}
          </section>

          {/* List Column (2/3 width) */}
          <section className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-5 backdrop-blur-sm">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-800/60 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Daftar Contoh ({activeTab === 'styles' ? filteredStyles.length : filteredRecs.length})
              </h2>

              <div className="flex items-center gap-3">
                {/* Language Filter */}
                <select
                  value={filterLang}
                  onChange={(e) => setFilterLang(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="id">Indo (ID)</option>
                  <option value="en">English (EN)</option>
                </select>

                {/* Section Filter (Only for styles tab) */}
                {activeTab === 'styles' ? (
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">Semua Bagian</option>
                    <option value="overview">Overview</option>
                    <option value="teachers_note">Catatan Guru</option>
                    <option value="parent_note">Catatan Orang Tua</option>
                  </select>
                ) : (
                  // Category Filter (Only for recs tab)
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="coding_dasar">Coding Dasar</option>
                    <option value="logika_terstruktur">Logika Terstruktur</option>
                    <option value="kreativitas">Kreativitas</option>
                    <option value="eksperimen">Eksperimen</option>
                  </select>
                )}
              </div>
            </div>

            {/* Content List */}
            {activeTab === 'styles' ? (
              filteredStyles.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Eye className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="font-semibold text-sm">Tidak Ada Contoh Gaya Ditemukan</p>
                  <p className="text-xs opacity-75 mt-1">Gunakan form di sebelah kiri untuk menambahkan contoh baru.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredStyles.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-3 relative hover:border-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                          {SECTION_LABELS[item.section_type]}
                        </span>
                        <button
                          onClick={() => handleDeleteStyle(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Hapus contoh ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredRecs.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Eye className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="font-semibold text-sm">Tidak Ada Rekomendasi Ditemukan</p>
                  <p className="text-xs opacity-75 mt-1">Gunakan form di sebelah kiri untuk menambahkan rekomendasi baru.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredRecs.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-3 relative hover:border-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                          Kategori: {CATEGORY_LABELS[item.category]}
                        </span>
                        <button
                          onClick={() => handleDeleteRec(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Hapus rekomendasi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
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
