'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { syncPendingReports } from '@/lib/schedule/syncPendingReports'
import { 
  Sparkles, 
  Send, 
  Save, 
  FileText, 
  Calendar, 
  Hash, 
  Languages, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Clock,
  ChevronRight
} from 'lucide-react'

export default function LaporanBuilderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Data States
  const [students, setStudents] = useState<any[]>([])
  const [datasetCount, setDatasetCount] = useState(0)
  const [pendingReportsMap, setPendingReportsMap] = useState<Record<string, any[]>>({})
  
  // Form Inputs
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [meetingNumber, setMeetingNumber] = useState<number>(1)
  const [reportDate, setReportDate] = useState('')
  const [materi, setMateri] = useState('')
  const [behavior, setBehavior] = useState('')
  const [language, setLanguage] = useState<'id' | 'en'>('id')
  const [reportType, setReportType] = useState<'full' | 'overview'>('full')
  
  // Pending Report ID tracker (if resolving a pending report)
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null)

  // AI Output & History Save States
  const [generatedText, setGeneratedText] = useState('')
  const [warningMsg, setWarningMsg] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // File Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper mappings
  const [meetingNumbersMap, setMeetingNumbersMap] = useState<Record<string, number>>({})
  const [nextDatesMap, setNextDatesMap] = useState<Record<string, string>>({})

  // Load User, Sync and Fetch data
  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Sync pending reports
        await syncPendingReports(supabase, user.id)

        // Fetch students & schedules
        const { data: studentsData } = await supabase
          .from('students')
          .select('*, schedules:schedule_student(schedule:schedules(*))')
          .eq('user_id', user.id)
          .order('name')

        // Fetch dataset counts
        const { count } = await supabase
          .from('dataset_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setDatasetCount(count || 0)

        if (studentsData) {
          setStudents(studentsData)

          // Fetch reports to calculate next meeting numbers and dates
          const { data: reportsData } = await supabase
            .from('reports')
            .select('student_id, meeting_number, report_date')
            .eq('user_id', user.id)
            .order('report_date', { ascending: false })
            .order('meeting_number', { ascending: false })

          // Calculate newest stats per student
          const latestReports: Record<string, any> = {}
          reportsData?.forEach(r => {
            if (!latestReports[r.student_id]) {
              latestReports[r.student_id] = r
            }
          })

          const meetNums: Record<string, number> = {}
          const nextDates: Record<string, string> = {}

          studentsData.forEach(s => {
            const lastReport = latestReports[s.id]
            const nextMeet = lastReport ? Number(lastReport.meeting_number) + 1 : Number(s.meeting_count || 0) + 1
            meetNums[s.id] = nextMeet

            let nextDate = ''
            if (lastReport) {
              const lastDate = new Date(lastReport.report_date)
              // Calculate next scheduled day
              const scheduleDays = (s.schedules || []).map((sc: any) => Number(sc.schedule?.day_of_week)).filter(Boolean)
              
              if (scheduleDays.length > 0) {
                const checkDate = new Date(lastDate)
                checkDate.setDate(checkDate.getDate() + 1)
                for (let i = 0; i < 14; i++) {
                  const jsDay = checkDate.getDay()
                  const dayIso = jsDay === 0 ? 7 : jsDay
                  if (scheduleDays.includes(dayIso)) {
                    nextDate = checkDate.toISOString().split('T')[0]
                    break
                  }
                  checkDate.setDate(checkDate.getDate() + 1)
                }
              }
              if (!nextDate) {
                const fallbackDate = new Date(lastDate)
                fallbackDate.setDate(fallbackDate.getDate() + 7)
                nextDate = fallbackDate.toISOString().split('T')[0]
              }
            } else {
              nextDate = s.first_meeting_date || new Date().toISOString().split('T')[0]
            }

            nextDates[s.id] = nextDate
          })

          setMeetingNumbersMap(meetNums)
          setNextDatesMap(nextDates)

          // Fetch Pending Reports
          const { data: pendingData } = await supabase
            .from('pending_reports')
            .select('*, student:students(*)')
            .order('meeting_number', { ascending: true })

          const filteredPending = pendingData?.filter(p => p.student?.user_id === user.id) || []
          const groupedPending: Record<string, any[]> = {}
          filteredPending.forEach(p => {
            if (!groupedPending[p.student_id]) {
              groupedPending[p.student_id] = []
            }
            groupedPending[p.student_id].push(p)
          })

          setPendingReportsMap(groupedPending)
        }
      }
    }
    initPage()
  }, [supabase])

  // Handle student dropdown selection change
  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id)
    setSelectedPendingId(null) // Reset pending tracker
    if (id) {
      setMeetingNumber(meetingNumbersMap[id] || 1)
      setReportDate(nextDatesMap[id] || '')
    } else {
      setMeetingNumber(1)
      setReportDate('')
    }
  }

  // Handle selecting a pending report item from the checklist
  const handleSelectPending = (p: any) => {
    setSelectedPendingId(p.id)
    setMeetingNumber(p.meeting_number)
    setReportDate(p.report_date)
  }

  // Generate Report via API
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return
    setGenerating(true)
    setGeneratedText('')
    setWarningMsg('')
    setStatusMsg(null)

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          meeting_number: meetingNumber,
          report_date: reportDate,
          materi,
          behavior,
          language,
          report_type: reportType
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'Gagal menghasilkan laporan.' })
      } else {
        setGeneratedText(data.text)
        if (data.warning) {
          setWarningMsg(data.warning)
        }
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' })
    } finally {
      setGenerating(false)
    }
  }

  // Save report to database
  const handleSaveToHistory = async () => {
    if (!selectedStudentId || !generatedText) return
    setSaving(true)
    setStatusMsg(null)

    try {
      let imageUrl: string | null = null

      // Upload file to Supabase Storage if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${selectedStudentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('reports')
          .upload(fileName, selectedImage)

        if (uploadErr) {
          throw new Error('Gagal mengunggah foto: ' + uploadErr.message)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('reports')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Save report record
      const student = students.find(s => s.id === selectedStudentId)
      const { error: insertErr } = await supabase.from('reports').insert({
        student_id: selectedStudentId,
        student_name: student.name,
        subject: student.subject,
        meeting_number: meetingNumber,
        report_date: reportDate,
        materi,
        behavior,
        content: generatedText,
        image_url: imageUrl,
        user_id: userId
      })

      if (insertErr) {
        throw new Error(insertErr.message)
      }

      // Delete resolved pending report
      if (selectedPendingId) {
        await supabase.from('pending_reports').delete().eq('id', selectedPendingId)
      }

      // Increment student meeting count
      const currentCount = student.meeting_count || 0
      await supabase.from('students')
        .update({ meeting_count: currentCount + 1 })
        .eq('id', selectedStudentId)

      setStatusMsg({ type: 'success', text: 'Laporan berhasil disimpan ke riwayat.' })

      // Clear Form & State
      setMateri('')
      setBehavior('')
      setGeneratedText('')
      setSelectedPendingId(null)
      setSelectedImage(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Refresh page data
      router.refresh()
      
      // Update values in-memory
      const nextMeet = meetingNumber + 1
      meetingNumbersMap[selectedStudentId] = nextMeet
      setMeetingNumber(nextMeet)
      
      // Calculate next reportDate locally
      const checkDate = new Date(reportDate)
      checkDate.setDate(checkDate.getDate() + 7)
      const nextDateStr = checkDate.toISOString().split('T')[0]
      nextDatesMap[selectedStudentId] = nextDateStr
      setReportDate(nextDateStr)

      // Remove saved pending report from map
      if (pendingReportsMap[selectedStudentId]) {
        const filtered = pendingReportsMap[selectedStudentId].filter(p => p.id !== selectedPendingId)
        setPendingReportsMap({
          ...pendingReportsMap,
          [selectedStudentId]: filtered
        })
      }

    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal menyimpan laporan.' })
    } finally {
      setSaving(false)
    }
  }

  const selectedStudentPending = selectedStudentId ? pendingReportsMap[selectedStudentId] || [] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400" />
          Buat Laporan AI
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Generate laporan harian murid secara instan dengan gaya bahasa Anda sendiri.
        </p>
      </div>

      {datasetCount === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm px-4 py-3.5 rounded-xl flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Dataset gaya masih kosong!</p>
            <p className="mt-1 text-xs opacity-90">
              Silakan tambahkan contoh laporan di tab <strong>Dataset Gaya</strong> agar AI dapat menyesuaikan nada, struktur, dan tata bahasanya dengan gaya menulis Anda.
            </p>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className={`border text-sm px-4 py-3.5 rounded-xl flex gap-3 items-start ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Form & Inputs */}
        <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800/60">
            <FileText className="w-5 h-5 text-indigo-400" />
            Detail Laporan
          </h2>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Student Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Pilih Murid
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Pilih Murid --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* If Student Selected, show Pending Reports reminder */}
            {selectedStudentId && selectedStudentPending.length > 0 && (
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  Jadwal Belum Dilaporkan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedStudentPending.map((p) => {
                    const isSelected = selectedPendingId === p.id
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleSelectPending(p)}
                        className={`
                          flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}
                        `}
                      >
                        <div>
                          <p>Meeting {p.meeting_number}</p>
                          <p className="text-[10px] opacity-75 mt-0.5">{p.report_date}</p>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Meet Number & Date inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Meeting Ke-
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    required
                    min={1}
                    value={meetingNumber}
                    onChange={(e) => setMeetingNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tanggal
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Material input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Materi Hari Ini
              </label>
              <textarea
                required
                rows={3}
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder="Contoh: Membuat game tank sederhana di Scratch dengan control arrow keys dan menembak spasi."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
              />
            </div>

            {/* Behavior input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Behavior / Observasi Murid
              </label>
              <textarea
                required
                rows={3}
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="Contoh: Murid sangat antusias, bisa mengikuti instruksi dengan cepat, sempat menanyakan logika percabangan, sangat teliti."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
              />
            </div>

            {/* Lang & Report type dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-slate-400" />
                  Bahasa Laporan
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">Bahasa Inggris (English)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tipe Ringkasan
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'full' | 'overview')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="full">Laporan Lengkap (+Latihan & Catatan)</option>
                  <option value="overview">Hanya Overview Laporan</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={generating || !selectedStudentId}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 disabled:text-slate-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sedang men-generate laporan dengan AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Generate Laporan AI</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Column: AI Output Editor & Save Form */}
        <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800/60">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Hasil AI & Editor Laporan
          </h2>

          {!generatedText && !generating && (
            <div className="h-96 border border-dashed border-slate-800 rounded-2xl flex flex-col justify-center items-center text-slate-500 p-8 text-center">
              <Sparkles className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-semibold text-sm">Belum Ada Laporan Ter-generate</p>
              <p className="text-xs opacity-75 mt-1 max-w-sm">
                Isi form di sebelah kiri lalu klik tombol Generate untuk membuat draft laporan progres otomatis.
              </p>
            </div>
          )}

          {generating && (
            <div className="h-96 border border-slate-800 bg-slate-950/20 rounded-2xl flex flex-col justify-center items-center text-slate-400 p-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="font-semibold text-sm">Menghubungkan ke API AI...</p>
              <p className="text-xs opacity-75 max-w-sm">
                AI sedang menganalisis materi dan mencocokkannya dengan database contoh tulisan Anda. Proses ini memakan waktu 3 - 8 detik.
              </p>
            </div>
          )}

          {generatedText && (
            <div className="space-y-5">
              {warningMsg && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-4 py-3 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{warningMsg}</span>
                </div>
              )}

              {/* Text editor for final output */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Edit Hasil Laporan (Jika Perlu)
                </label>
                <textarea
                  rows={14}
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed resize-y"
                />
              </div>

              {/* Optional image attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Lampirkan Foto Progres (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan ke Riwayat...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Simpan ke Riwayat Laporan</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
