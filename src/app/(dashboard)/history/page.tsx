'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import CustomSelect from '@/components/CustomSelect'
import { useTranslation } from '@/components/LocaleProvider'
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
  ChevronDown,
  ArrowUpDown,
  Eye,
  Share2
} from 'lucide-react'

export default function HistoryPage() {
  const supabase = createClient()
  const { t, locale } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Data States
  const [reports, setReports] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('all')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  // Copy State Tracker
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null)

  const handleShareLink = (studentName: string, studentId: string) => {
    const slug = studentName
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedStudentId(studentId)
    setTimeout(() => setCopiedStudentId(null), 2000)
    triggerToast('success', locale === 'id' ? 'Link portal orang tua berhasil disalin!' : 'Parent portal link copied successfully!')
  }

  // Expanded States
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({})
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({})

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }

  const toggleReportExpand = (reportId: string) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }))
  }

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

  // Group filtered reports by student
  const groupedReports: Record<string, {
    studentId: string,
    studentName: string,
    subject: string,
    reports: any[]
  }> = {}

  filteredReports.forEach(r => {
    if (!groupedReports[r.student_id]) {
      groupedReports[r.student_id] = {
        studentId: r.student_id,
        studentName: r.student_name,
        subject: r.subject,
        reports: []
      }
    }
    groupedReports[r.student_id].reports.push(r)
  })

  const groupedList = Object.values(groupedReports)

  // Sort reports within each student group
  groupedList.forEach(group => {
    group.reports.sort((a, b) => {
      const dateA = new Date(a.report_date).getTime()
      const dateB = new Date(b.report_date).getTime()
      if (sortOrder === 'recent') {
        return dateB - dateA || b.meeting_number - a.meeting_number
      } else {
        return dateA - dateB || a.meeting_number - b.meeting_number
      }
    })
  })

  // Sort the student groups based on their most relevant report date
  groupedList.sort((a, b) => {
    const dateA = a.reports.length > 0 ? new Date(a.reports[0].report_date).getTime() : 0
    const dateB = b.reports.length > 0 ? new Date(b.reports[0].report_date).getTime() : 0
    if (sortOrder === 'recent') {
      return dateB - dateA
    } else {
      return dateA - dateB
    }
  })

  const studentFilterOptions = [
    { value: 'all', label: locale === 'id' ? 'Semua Murid' : 'All Students' },
    ...students.map(s => ({ value: s.id, label: s.name }))
  ]

  const sortOptions = [
    { value: 'recent', label: locale === 'id' ? 'Terbaru (Recent)' : 'Most Recent' },
    { value: 'oldest', label: locale === 'id' ? 'Terlama (Oldest)' : 'Oldest' }
  ]

  return (
    <div className="space-y-6">
      {/* Primary Content Header (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-black tracking-tighter uppercase font-editorial-headline">{t('history_title')}</h2>
          <div className="h-4 w-px bg-black/10" />
          <span className="text-xs font-medium text-neutral-500 font-mono tracking-wider">
            {reports.length} {locale === 'id' ? 'Laporan Tersimpan' : 'Saved Reports'}
          </span>
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

      {/* Filter and Search Bar (White background, border 1px, shadow, py-2.5 inputs h-42px) */}
      <div className="bg-white border border-black/10 p-4 rounded-2xl shadow-none flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={t('placeholder_search_history')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input-premium pl-10 shadow-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
          {/* Student Filter dropdown */}
          <div className="relative w-full sm:w-[200px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
              <User className="w-4 h-4" />
            </div>
            <CustomSelect
              options={studentFilterOptions}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              placeholder="Semua Murid"
              className="pl-10"
            />
          </div>

          {/* Sort Order Selector dropdown */}
          <div className="relative w-full sm:w-[170px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <CustomSelect
              options={sortOptions}
              value={sortOrder}
              onChange={(val) => setSortOrder(val as any)}
              placeholder={locale === 'id' ? 'Urutkan' : 'Sort By'}
              isSearchable={false}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
        </div>
      ) : groupedList.length === 0 ? (
        <div className="border border-dashed border-black/10 bg-white rounded-2xl p-16 text-center text-neutral-400 shadow-none">
          <History className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="font-bold text-black text-sm font-mono uppercase tracking-wider">
            {locale === 'id' ? 'Tidak Ada Riwayat Laporan' : 'No Report History Found'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {locale === 'id' 
              ? 'Belum ada laporan yang sesuai dengan kriteria pencarian Anda.' 
              : 'No reports match your current search filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedList.map((group) => {
            const isExpanded = !!expandedStudents[group.studentId]
            return (
              <div 
                key={group.studentId}
                className="bg-white border border-black/10 rounded-2xl shadow-none overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/20"
              >
                {/* Accordion Trigger (Student Header) */}
                <div 
                  onClick={() => toggleStudentExpand(group.studentId)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                      {group.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-black text-sm">{group.studentName}</h3>
                      <p className="text-xs text-neutral-500 font-medium font-mono uppercase tracking-wider">{group.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShareLink(group.studentName, group.studentId)
                      }}
                      className={`
                        px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer h-7 font-mono uppercase tracking-wider
                        ${copiedStudentId === group.studentId 
                          ? 'bg-black border-black text-white' 
                          : 'bg-white border-black/10 text-neutral-500 hover:text-black hover:bg-neutral-100'}
                      `}
                      title={locale === 'id' ? 'Salin Link Portal' : 'Copy Portal Link'}
                    >
                      {copiedStudentId === group.studentId ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                      <span>{copiedStudentId === group.studentId ? (locale === 'id' ? 'Disalin' : 'Copied') : (locale === 'id' ? 'Bagikan' : 'Share')}</span>
                    </button>
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-neutral-100 border border-black/5 text-black text-xs font-bold rounded-xl font-mono uppercase">
                      {group.reports.length} {locale === 'id' ? 'Laporan' : 'Reports'}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Accordion Body (Report List) */}
                {isExpanded && (
                  <div className="border-t border-black/10 bg-neutral-50/30 divide-y divide-black/5">
                    {group.reports.map((report) => {
                      const isReportExpanded = !!expandedReports[report.id]
                      return (
                        <div key={report.id} className="p-4 space-y-4 bg-white first:pt-4 last:pb-4">
                          
                          {/* Report row header */}
                          <div 
                            onClick={() => toggleReportExpand(report.id)}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-black border border-transparent text-white text-xs font-bold rounded-xl font-mono shrink-0">
                                {locale === 'id' ? 'Meet' : 'Meeting'} {report.meeting_number}
                              </span>
                              <span className="text-xs text-neutral-400 font-mono shrink-0 flex items-center gap-1 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                                {report.report_date}
                              </span>
                              <p className="text-xs text-neutral-700 font-semibold truncate max-w-xs md:max-w-md hidden sm:block">
                                {report.materi}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyText(report.id, report.content)
                                }}
                                className={`
                                  px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer h-7 font-mono uppercase tracking-wider
                                  ${copiedId === report.id 
                                    ? 'bg-white border-black text-black font-bold' 
                                    : 'bg-white border-black/10 text-neutral-500 hover:text-black hover:bg-neutral-100'}
                                `}
                              >
                                {copiedId === report.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId === report.id ? t('btn_copied') : (locale === 'id' ? 'Salin' : 'Copy')}</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleReportExpand(report.id)
                                }}
                                className={`p-1.5 rounded-xl transition-colors cursor-pointer border h-7 w-7 flex items-center justify-center shadow-none ${
                                  isReportExpanded 
                                    ? 'bg-black text-white border-black' 
                                    : 'bg-white text-neutral-500 border-black/10 hover:text-black hover:bg-neutral-100'
                                }`}
                                title={locale === 'id' ? 'Lihat Detail Laporan' : 'View Report Details'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEditModal(report)
                                }}
                                className="text-neutral-500 hover:text-black p-1.5 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer border border-black/10 bg-white h-7 w-7 flex items-center justify-center shadow-none"
                                title={t('btn_edit')}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteReport(report.id)
                                }}
                                className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer border border-black/10 bg-white h-7 w-7 flex items-center justify-center shadow-none font-bold"
                                title={t('btn_delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <ChevronDown 
                                className={`w-4 h-4 text-neutral-400 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                  isReportExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {/* Mobile-only materi preview row */}
                          <p className="text-xs text-neutral-700 font-semibold block sm:hidden cursor-pointer" onClick={() => toggleReportExpand(report.id)}>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5 font-mono">
                              {locale === 'id' ? 'Topik:' : 'Topic:'}
                            </span>
                            {report.materi}
                          </p>

                          {/* Expanded Details Box */}
                          {isReportExpanded && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 bg-neutral-50 border border-black/5 rounded-2xl p-4.5 mt-2 transition-all">
                              
                              {/* Inputs details (1/3) */}
                              <div className="space-y-3.5 text-xs font-medium">
                                <div>
                                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
                                    {locale === 'id' ? 'Materi Diajarkan:' : 'Lesson Taught:'}
                                  </span>
                                  <p className="text-black leading-relaxed font-mono whitespace-pre-wrap bg-white border border-black/10 p-3 rounded-xl shadow-none">{report.materi}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
                                    {locale === 'id' ? 'Behavior & Observasi:' : 'Behavior & Observation:'}
                                  </span>
                                  <p className="text-black leading-relaxed font-mono whitespace-pre-wrap bg-white border border-black/10 p-3 rounded-xl shadow-none">{report.behavior}</p>
                                </div>
                                {report.image_url && (
                                  <div>
                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2 font-mono">
                                      {locale === 'id' ? 'Foto Progres:' : 'Progress Photo:'}
                                    </span>
                                    <a 
                                      href={report.image_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="group relative block w-full max-w-[240px] aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-black/10 shadow-none"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img 
                                        src={report.image_url} 
                                        alt="Progress" 
                                        className="w-full h-full object-cover filter grayscale contrast-115 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium gap-1 text-[10px] uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        {locale === 'id' ? 'Buka Gambar' : 'Open Image'}
                                      </div>
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* AI report output content (2/3) */}
                              <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-5 relative shadow-none flex flex-col min-h-[200px]">
                                <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[9px] font-extrabold text-white uppercase tracking-widest bg-black px-2.5 py-1 rounded-xl font-mono">
                                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                  <span>{locale === 'id' ? 'Hasil Laporan' : 'Report Output'}</span>
                                </div>
                                <pre className="text-xs text-black leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto pr-2 mt-4 flex-1">
                                  {report.content}
                                </pre>
                              </div>

                            </div>
                          )}

                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white border border-black/10 rounded-2xl p-6 shadow-none relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-black p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-wider font-mono">
              <Edit2 className="w-4 h-4 text-black" />
              <span>{t('modal_edit_report')}</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {locale === 'id' ? 'Pertemuan Ke-' : 'Meeting Number'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editMeetingNumber}
                    onChange={(e) => setEditMeetingNumber(Number(e.target.value))}
                    className="form-input-premium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {locale === 'id' ? 'Tanggal Laporan' : 'Report Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editReportDate}
                    onChange={(e) => setEditReportDate(e.target.value)}
                    className="form-input-premium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {locale === 'id' ? 'Topik/Materi' : 'Topic/Material'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={editMateri}
                  onChange={(e) => setEditMateri(e.target.value)}
                  className="form-textarea-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {locale === 'id' ? 'Behavior & Observasi' : 'Behavior & Observation'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={editBehavior}
                  onChange={(e) => setEditBehavior(e.target.value)}
                  className="form-textarea-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {locale === 'id' ? 'Konten Laporan Akhir (Final Draft)' : 'Final Report Draft Content'}
                </label>
                <textarea
                  required
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="form-textarea-premium font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">
                  <ImageIcon className="w-4 h-4 text-neutral-400" />
                  {locale === 'id' ? 'Ganti Foto Progres Baru (Opsional)' : 'Change to New Progress Photo (Optional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-black/10 rounded-xl p-2.5 text-xs text-neutral-550 focus:outline-none file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-black file:text-white hover:file:bg-neutral-800 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-white border border-black/10 hover:bg-neutral-100 text-black font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-none cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{locale === 'id' ? 'Simpan Perubahan' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
