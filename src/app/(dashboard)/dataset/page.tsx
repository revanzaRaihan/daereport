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
      {/* Primary Content Header (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Dataset Gaya & Latihan</h2>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-sm font-medium text-slate-500">
            {activeTab === 'styles' ? `${styles.length} Contoh Gaya` : `${recommendations.length} Rekomendasi`}
          </span>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#EFF6FF] border border-blue-100 p-1 rounded-xl flex gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'styles' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Gaya Teks Laporan
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recommendations' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rekomendasi Game
          </button>
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

      {/* Description Box */}
      <div className="bg-[#EFF6FF] border border-blue-100/50 rounded-2xl p-5 flex gap-3.5 items-start shadow-card">
        <div className="p-2 bg-white rounded-xl text-blue-600 border border-blue-100 shadow-card shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="font-extrabold text-slate-900 text-sm">Bagaimana ini bekerja?</p>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            AI tidak menggunakan template kaku. AI akan meneliti contoh-contoh gaya bahasa, diksi, dan rekomendasi latihan yang Anda daftarkan di bawah ini. Ketika Anda men-generate laporan, AI akan menirunya (few-shot learning) agar hasilnya sangat natural mirip buatan Anda sendiri.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Input Form Column (1/3 width) */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-card transition-all duration-200 hover:border-blue-200">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>{activeTab === 'styles' ? 'Tambah Gaya Bahasa' : 'Tambah Rekomendasi'}</span>
            </h2>

            {activeTab === 'styles' ? (
              <form onSubmit={handleStyleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Bahasa
                  </label>
                  <select
                    value={styleLang}
                    onChange={(e) => setStyleLang(e.target.value as 'id' | 'en')}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">Bahasa Inggris (English)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Bagian Laporan (Section)
                  </label>
                  <select
                    value={styleSection}
                    onChange={(e) => setStyleSection(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
                  >
                    <option value="overview">Overview Laporan</option>
                    <option value="teachers_note">Catatan Guru (Teacher's Note)</option>
                    <option value="parent_note">Catatan Orang Tua (Parent Note)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Contoh Teks Laporan
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={styleBody}
                    onChange={(e) => setStyleBody(e.target.value)}
                    placeholder="Masukkan paragraf contoh laporan yang pernah Anda tulis secara manual sebelumnya..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-400 transition-colors font-mono leading-relaxed resize-y font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !styleBody.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md shadow-blue-200/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Contoh Gaya</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Bahasa
                  </label>
                  <select
                    value={recLang}
                    onChange={(e) => setRecLang(e.target.value as 'id' | 'en')}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">Bahasa Inggris (English)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Kategori Latihan
                  </label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
                  >
                    <option value="coding_dasar">Coding Dasar</option>
                    <option value="logika_terstruktur">Logika Terstruktur</option>
                    <option value="kreativitas">Kreativitas</option>
                    <option value="eksperimen">Eksperimen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Contoh Teks Rekomendasi Game
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={recBody}
                    onChange={(e) => setRecBody(e.target.value)}
                    placeholder="Format persis wajib seperti:&#13;1. Kodable: https://studio.kodable.com"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-400 transition-colors font-mono leading-relaxed resize-y font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !recBody.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md shadow-blue-200/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Rekomendasi</span>
                </button>
              </form>
            )}
          </section>

          {/* List Column (2/3 width) */}
          <section className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5 shadow-card transition-all duration-200 hover:border-blue-200">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Daftar Contoh ({activeTab === 'styles' ? filteredStyles.length : filteredRecs.length})</span>
              </h2>

              <div className="flex items-center gap-2">
                {/* Language Filter */}
                <select
                  value={filterLang}
                  onChange={(e) => setFilterLang(e.target.value as any)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-slate-700 h-[36px] font-bold focus:outline-none focus:border-blue-400"
                >
                  <option value="id">Indo (ID)</option>
                  <option value="en">English (EN)</option>
                </select>

                {/* Section Filter (Only for styles tab) */}
                {activeTab === 'styles' ? (
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-slate-700 h-[36px] font-bold focus:outline-none focus:border-blue-400"
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
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-slate-700 h-[36px] font-bold focus:outline-none focus:border-blue-400"
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
                <div className="border border-dashed border-[#E2E8F0] rounded-2xl p-12 text-center text-slate-400">
                  <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Tidak Ada Contoh Gaya Ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Gunakan form di sebelah kiri untuk menambahkan contoh baru.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredStyles.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3 relative hover:border-blue-200 transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-extrabold uppercase tracking-widest rounded-xl">
                          {SECTION_LABELS[item.section_type]}
                        </span>
                        <button
                          onClick={() => handleDeleteStyle(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus contoh ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap font-medium bg-white p-3 rounded-lg border border-slate-100">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredRecs.length === 0 ? (
                <div className="border border-dashed border-[#E2E8F0] rounded-2xl p-12 text-center text-slate-400">
                  <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Tidak Ada Rekomendasi Ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Gunakan form di sebelah kiri untuk menambahkan rekomendasi baru.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {filteredRecs.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3 relative hover:border-blue-200 transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-extrabold uppercase tracking-widest rounded-xl">
                          Kategori: {CATEGORY_LABELS[item.category]}
                        </span>
                        <button
                          onClick={() => handleDeleteRec(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus rekomendasi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap font-medium bg-white p-3 rounded-lg border border-slate-100">
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
