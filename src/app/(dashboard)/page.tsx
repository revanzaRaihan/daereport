'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { syncPendingReports } from '@/lib/schedule/syncPendingReports'
import { 
  Sparkles, 
  Send, 
  Save, 
  Calendar, 
  Hash, 
  Languages, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Clock,
  BookOpen,
  History,
  GraduationCap
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

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id)
    setSelectedPendingId(null)
    if (id) {
      setMeetingNumber(meetingNumbersMap[id] || 1)
      setReportDate(nextDatesMap[id] || '')
    } else {
      setMeetingNumber(1)
      setReportDate('')
    }
  }

  const handleSelectPending = (p: any) => {
    setSelectedPendingId(p.id)
    setMeetingNumber(p.meeting_number)
    setReportDate(p.report_date)
  }

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

  const handleSaveToHistory = async () => {
    if (!selectedStudentId || !generatedText) return
    setSaving(true)
    setStatusMsg(null)

    try {
      let imageUrl: string | null = null

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${selectedStudentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('reports')
          .upload(fileName, selectedImage)

        if (uploadErr) {
          throw new Error('Gagal mengunggah foto: ' + uploadErr.message)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('reports')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

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

      if (selectedPendingId) {
        await supabase.from('pending_reports').delete().eq('id', selectedPendingId)
      }

      const currentCount = student.meeting_count || 0
      await supabase.from('students')
        .update({ meeting_count: currentCount + 1 })
        .eq('id', selectedStudentId)

      setStatusMsg({ type: 'success', text: 'Laporan berhasil disimpan ke riwayat.' })

      setMateri('')
      setBehavior('')
      setGeneratedText('')
      setSelectedPendingId(null)
      setSelectedImage(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      router.refresh()
      
      const nextMeet = meetingNumber + 1
      meetingNumbersMap[selectedStudentId] = nextMeet
      setMeetingNumber(nextMeet)
      
      const checkDate = new Date(reportDate)
      checkDate.setDate(checkDate.getDate() + 7)
      const nextDateStr = checkDate.toISOString().split('T')[0]
      nextDatesMap[selectedStudentId] = nextDateStr
      setReportDate(nextDateStr)

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
  const currentStudent = students.find(s => s.id === selectedStudentId)
  
  // Calculate total pending reports for header counter
  const totalPendingReportsCount = Object.values(pendingReportsMap).reduce((acc, curr) => acc + curr.length, 0)

  return (
    <div className="space-y-6">
      
      {/* 1. PRIMARY CONTENT HEADER (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Buat Laporan AI</h2>
        </div>

        {/* Button group: secondary outline + primary blue */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dataset"
            className="h-10 px-4 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer bg-white shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Dataset Gaya</span>
          </Link>
          
          <Link
            href="/history"
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all duration-200 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-200/50"
          >
            <History className="w-4 h-4" />
            <span>Lihat Riwayat</span>
          </Link>
        </div>
      </div>

      {datasetCount === 0 && (
        <div className="bg-amber-50 border border-amber-100/60 text-amber-800 text-xs px-4 py-3 rounded-2xl flex gap-3 items-start shadow-card">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Dataset Gaya Kosong</span>
            <p className="mt-0.5 text-slate-600">
              Silakan tambahkan minimal 1 contoh di tab <strong>Dataset Gaya</strong> agar AI memahami karakter tulisan Anda.
            </p>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className={`border text-xs px-4 py-3 rounded-2xl flex gap-3 items-start shadow-card ${
          statusMsg.type === 'success' 
            ? 'bg-green-50 border-green-100 text-green-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-500" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* 2. FILTER & SEARCH BAR (Horizontal layout, 16px padding, white, border-1px, py-2.5 inputs h-42px) */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Student Selector: flex-1, icon-prefix, bg-slate-50, 12px rounded-xl */}
        <div className="relative flex-1 w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 h-[42px] text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-300 transition-colors"
          >
            <option value="">-- Pilih Murid Les --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker: bg-slate-50, prefix */}
        <div className="relative w-full md:w-auto md:min-w-[170px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 h-[42px] text-sm text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
          />
        </div>

        {/* Language select: min-width 140px, bold 14px text */}
        <div className="relative w-full md:w-auto md:min-w-[150px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Languages className="w-4 h-4" />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 h-[42px] text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-300 transition-colors"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English (EN)</option>
          </select>
        </div>

        {/* Summary type select: min-width 140px, bold 14px text */}
        <div className="relative w-full md:w-auto md:min-w-[150px]">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 h-[42px] text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-300 transition-colors"
          >
            <option value="full">Laporan Lengkap</option>
            <option value="overview">Hanya Ringkasan</option>
          </select>
        </div>

      </div>

      {/* 3. DATA CARD GRID (2-column grid xl:grid-cols-2 with 24px gap-6) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* CARD 1: INPUT DETAILS (padding p-6, rounded-2xl, card-shadow) */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-card space-y-5 transition-all duration-200 hover:border-blue-200">
          {/* Card Header: 48px avatar, title, subtitle, top-right status badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-blue-600 flex items-center justify-center font-bold text-sm">
                {currentStudent ? currentStudent.name.substring(0, 2).toUpperCase() : 'LS'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {currentStudent ? currentStudent.name : 'Pilih Murid'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {currentStudent ? currentStudent.subject : 'Pelajaran les privat'}
                </p>
              </div>
            </div>

            {/* Status Badge: Compact, color-coded, 10px bold uppercase */}
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
              MEETING {meetingNumber}
            </span>
          </div>

          {/* Form Body */}
          <div className="space-y-4 pt-2">

            {/* Manual Meeting Number & Date Override */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Pertemuan Ke-
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">#</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={meetingNumber}
                    onChange={(e) => setMeetingNumber(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-7 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 h-9 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Tanggal Laporan
                </label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 h-9 font-semibold"
                />
              </div>
            </div>

            {/* Material Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Materi Belajar Hari Ini
              </label>
              <textarea
                required
                rows={3}
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder="Masukkan topik, konsep, atau proyek yang dikerjakan murid..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors resize-y leading-relaxed font-medium"
              />
            </div>

            {/* Behavior Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Behavior / Observasi Murid
              </label>
              <textarea
                required
                rows={3}
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="Ketik bagaimana fokus murid, keaktifan, kendala, atau pencapaian sikapnya..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors resize-y leading-relaxed font-medium"
              />
            </div>

            {/* Optional Image Upload */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Lampirkan Foto Progres (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-slate-500 focus:outline-none file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>

          </div>

          {/* Card Footer: Generate trigger Button */}
          <div className="pt-2 border-t border-[#E2E8F0]">
            <button
              type="submit"
              onClick={handleGenerate}
              disabled={generating || !selectedStudentId}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 disabled:text-slate-100 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md shadow-blue-200/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menganalisis & Menyusun Laporan AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate Draft Laporan AI</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* CARD 2: EDITOR & SAVE (padding p-6, rounded-2xl, card-shadow) */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-card space-y-5 transition-all duration-200 hover:border-blue-200">
          
          {/* Card Header: 48px avatar, title, subtitle, top-right status badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-[#E2E8F0] text-slate-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Draf Hasil Laporan</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {generatedText ? 'Draf AI berhasil dibuat' : 'Belum ada draf terbuat'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              generatedText 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {generatedText ? 'READY' : 'EMPTY'}
            </span>
          </div>

          {/* Form Body / Content Area */}
          <div className="space-y-4 min-h-[295px] flex flex-col justify-between">
            {!generatedText && !generating && (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-400 border border-dashed border-[#E2E8F0] rounded-xl min-h-[200px]">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-500">Menunggu Pembuatan Laporan</span>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[250px]">
                  Pilih murid dan isi deskripsi materi di sebelah kiri, lalu klik tombol Generate.
                </p>
              </div>
            )}

            {generating && (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-400 bg-slate-55/20 border border-dashed border-[#E2E8F0] rounded-xl min-h-[200px] space-y-2">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Memproses...</span>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[220px]">
                  AI sedang mencocokkan materi dengan contoh dataset Anda.
                </p>
              </div>
            )}

            {generatedText && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                {warningMsg && (
                  <div className="bg-amber-50 border border-amber-100/60 text-amber-700 text-[10px] px-3.5 py-2 rounded-xl flex gap-2 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                    <span>{warningMsg}</span>
                  </div>
                )}

                {/* Edit content textarea */}
                <div className="flex-1 flex flex-col">
                  <textarea
                    rows={10}
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    className="w-full flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-slate-700 font-mono leading-relaxed focus:outline-none focus:border-blue-400 resize-y"
                  />
                </div>
                {/* Placeholder empty gap */}
              </div>
            )}
          </div>

          {/* Card Footer: Save Trigger Button */}
          {generatedText && (
            <div className="pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-md shadow-blue-200/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Laporan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Ke Riwayat Laporan</span>
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
