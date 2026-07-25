'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  History, 
  Search, 
  Copy, 
  Trash2, 
  Edit2, 
  Check, 
  Loader2, 
  X,
  User,
  Calendar,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown
} from 'lucide-react'

export default function HistoryPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Data States
  const [reports, setReports] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('all')

  // Copy State Tracker
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Edit Form States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingReport, setEditingReport] = useState<any | null>(null)
  const [editMeetingNumber, setEditMeetingNumber] = useState<number>(1)
  const [editReportDate, setEditReportDate] = useState('')
  const [editMateri, setEditMateri] = useState('')
  const [editBehavior, setEditBehavior] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImage, setEditImage] = useState<File | null>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [updating, setUpdating] = useState(false)

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // Fetch students to populate filter
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, name')
          .eq('user_id', user.id)
        setStudents(studentsData || [])

        // Fetch history reports
        const { data: reportsData } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('report_date', { ascending: false })
          .order('meeting_number', { ascending: false })
        setReports(reportsData || [])
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

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini dari riwayat?')) return

    try {
      const { error } = await supabase.from('reports').delete().eq('id', id)
      if (error) throw error
      triggerToast('success', 'Laporan berhasil dihapus.')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menghapus laporan.')
    }
  }

  const handleOpenEditModal = (report: any) => {
    setEditingReport(report)
    setEditMeetingNumber(report.meeting_number)
    setEditReportDate(report.report_date)
    setEditMateri(report.materi)
    setEditBehavior(report.behavior)
    setEditContent(report.content)
    setEditImage(null)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport) return
    setUpdating(true)

    try {
      let imageUrl = editingReport.image_url

      // If new image is uploaded
      if (editImage) {
        const fileExt = editImage.name.split('.').pop()
        const fileName = `${editingReport.student_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('reports')
          .upload(fileName, editImage)

        if (uploadErr) {
          throw new Error('Gagal mengunggah foto baru: ' + uploadErr.message)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('reports')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Update Report Row
      const { error } = await supabase
        .from('reports')
        .update({
          meeting_number: editMeetingNumber,
          report_date: editReportDate,
          materi: editMateri,
          behavior: editBehavior,
          content: editContent,
          image_url: imageUrl
        })
        .eq('id', editingReport.id)

      if (error) throw error

      triggerToast('success', 'Laporan berhasil diperbarui.')
      setShowEditModal(false)
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal memperbarui laporan.')
    } finally {
      setUpdating(false)
    }
  }

  // Frontend Filter
  const filteredReports = reports.filter(r => {
    const matchStudent = selectedStudentId === 'all' || r.student_id === selectedStudentId
    const text = (r.student_name + ' ' + r.subject + ' ' + r.materi + ' ' + r.behavior + ' ' + r.content).toLowerCase()
    const matchSearch = text.includes(searchQuery.toLowerCase())
    return matchStudent && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-indigo-400" />
          Riwayat Laporan
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Lihat kembali, salin, atau edit laporan progres belajar murid yang sudah Anda simpan.
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

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari materi, behavior, isi laporan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Student Filter dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:block">
            Filter Murid:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full sm:w-56 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
          >
            <option value="all">Semua Murid</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500">
          <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="font-semibold text-sm">Tidak Ada Riwayat Laporan</p>
          <p className="text-xs opacity-75 mt-1">Belum ada laporan yang sesuai dengan kriteria pencarian Anda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-800/80 transition-all space-y-4"
            >
              {/* Report Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-950/60">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-base">{report.student_name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-md">
                      <BookOpen className="w-3 h-3" />
                      {report.subject}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 text-slate-400 text-xs font-semibold rounded-md">
                      Meeting {report.meeting_number}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {report.report_date}
                  </p>
                </div>

                {/* Actions: Copy, Edit, Delete */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyText(report.id, report.content)}
                    className={`
                      px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer
                      ${copiedId === report.id 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'}
                    `}
                  >
                    {copiedId === report.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === report.id ? 'Tersalin' : 'Salin Laporan'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(report)}
                    className="text-slate-400 hover:text-white p-2 hover:bg-slate-850 rounded-lg transition-colors cursor-pointer border border-slate-900 bg-slate-950/60"
                    title="Edit Laporan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-slate-900 bg-slate-950/60"
                    title="Hapus Laporan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid: Inputs summary vs AI generated report */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Inputs Info Column (1/3) */}
                <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-4 space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Materi Diajarkan:</span>
                    <p className="text-slate-300 font-medium leading-relaxed font-mono">{report.materi}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Behavior & Observasi:</span>
                    <p className="text-slate-300 font-medium leading-relaxed font-mono">{report.behavior}</p>
                  </div>
                  {report.image_url && (
                    <div className="pt-2">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-2">Foto Progres:</span>
                      <a 
                        href={report.image_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative block w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-850"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={report.image_url} 
                          alt="Progress" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium gap-1 text-[10px] uppercase tracking-wider backdrop-blur-[2px] transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Buka Gambar
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* AI Output Content (2/3) */}
                <div className="lg:col-span-2 bg-slate-950/60 border border-slate-900/80 rounded-xl p-5 relative">
                  <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/40 border border-slate-850 px-2 py-1 rounded-md">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Assembled Draft
                  </div>
                  <pre className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto pr-2">
                    {report.content}
                  </pre>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              Edit Riwayat Laporan
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Meeting Ke-
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editMeetingNumber}
                    onChange={(e) => setEditMeetingNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Tanggal Laporan
                  </label>
                  <input
                    type="date"
                    required
                    value={editReportDate}
                    onChange={(e) => setEditReportDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Materi
                </label>
                <textarea
                  required
                  rows={2}
                  value={editMateri}
                  onChange={(e) => setEditMateri(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Behavior
                </label>
                <textarea
                  required
                  rows={2}
                  value={editBehavior}
                  onChange={(e) => setEditBehavior(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Konten Hasil Laporan (Final Draft)
                </label>
                <textarea
                  required
                  rows={10}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-mono leading-relaxed focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Ganti/Unggah Foto Progres Baru (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 text-xs focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-medium px-4 py-2.5 rounded-xl cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-1 shadow-lg shadow-indigo-600/10 cursor-pointer text-sm"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
