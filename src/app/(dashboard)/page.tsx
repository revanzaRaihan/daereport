'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { syncPendingReports } from '@/lib/schedule/syncPendingReports'
import CustomSelect from '@/components/CustomSelect'
import CustomDatePicker from '@/components/CustomDatePicker'
import { useTranslation } from '@/components/LocaleProvider'
import { 
  Sparkles, 
  PenTool,
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
  GraduationCap,
  X
} from 'lucide-react'

export default function LaporanBuilderPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale } = useTranslation()
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
      let currentUserId = userId
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          currentUserId = user.id
          setUserId(user.id)
        }
      }

      if (!currentUserId) {
        throw new Error(locale === 'id' ? 'Sesi berakhir, silakan login kembali.' : 'Session expired, please login again.')
      }

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
        user_id: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (insertErr) {
        throw new Error(insertErr.message)
      }

      if (selectedPendingId) {
        await supabase.from('pending_reports').delete().eq('id', selectedPendingId)
      }

      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', selectedStudentId)

      await supabase.from('students')
        .update({ meeting_count: reportsCount || 0 })
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

  const studentOptions = students.map(s => ({ value: s.id, label: `${s.name} (${s.subject})` }))

  const languageOptions = [
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'en', label: 'English (EN)' }
  ]

  const reportTypeOptions = [
    { value: 'full', label: 'Laporan Lengkap' },
    { value: 'overview', label: 'Hanya Ringkasan' }
  ]

  return (
    <div className="space-y-6">
      
      <div className="h-16 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <PenTool className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-black tracking-tighter uppercase font-editorial-headline">{t('header_create_ai')}</h2>
        </div>

        {/* Button group: secondary outline + primary blue */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dataset"
            className="h-10 px-4 rounded-xl border border-black/10 hover:bg-neutral-100 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] text-xs font-semibold text-black flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <BookOpen className="w-4 h-4 text-neutral-400" />
            <span>{t('nav_dataset')}</span>
          </Link>
          
          <Link
            href="/history"
            className="h-10 px-4 rounded-xl bg-black hover:bg-neutral-800 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>{locale === 'id' ? 'Lihat Riwayat' : 'View History'}</span>
          </Link>
        </div>
      </div>

      {datasetCount === 0 && (
        <div className="bg-white border border-black text-black text-xs px-4 py-3 rounded-2xl flex gap-3 items-start shadow-none">
          <AlertCircle className="w-4 h-4 text-black mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">{locale === 'id' ? 'Dataset Gaya Kosong' : 'Writing Style Dataset Empty'}</span>
            <p className="mt-0.5 text-neutral-500">
              {locale === 'id' 
                ? 'Silakan tambahkan minimal 1 contoh di tab Dataset Gaya agar AI memahami karakter tulisan Anda.' 
                : 'Please add at least 1 writing example in the Writing Style tab so the AI can learn your writing tone.'}
            </p>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className={`border text-xs px-4 py-3 rounded-2xl flex gap-3 items-start shadow-none bg-white border-black text-black`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-black" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-black" />}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* 2. FILTER & SEARCH BAR (Responsive grid, 16px padding, white, border-1px, py-2.5 inputs h-42px) */}
      <div className="bg-card border border-border-color p-4 rounded-2xl shadow-none grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-center">
        
        {/* Student Selector: col-span-5, icon-prefix */}
        <div className="relative w-full lg:col-span-5">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary z-10">
            <GraduationCap className="w-4 h-4" />
          </div>
          <CustomSelect
            options={studentOptions}
            value={selectedStudentId}
            onChange={handleStudentChange}
            placeholder={t('placeholder_student')}
            className="pl-10"
          />
        </div>

        {/* Date Picker: col-span-3 */}
        <div className="relative w-full lg:col-span-3">
          <CustomDatePicker
            value={reportDate}
            onChange={(val) => setReportDate(val)}
            placeholder={t('placeholder_date')}
          />
        </div>

        {/* Language select: col-span-2, icon-prefix */}
        <div className="relative w-full lg:col-span-2">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary z-10">
            <Languages className="w-4 h-4" />
          </div>
          <CustomSelect
            options={languageOptions}
            value={language}
            onChange={(val) => setLanguage(val as any)}
            placeholder={t('placeholder_lang')}
            isSearchable={false}
            className="pl-10"
          />
        </div>

        {/* Summary type select: col-span-2 */}
        <div className="relative w-full lg:col-span-2">
          <CustomSelect
            options={reportTypeOptions}
            value={reportType}
            onChange={(val) => setReportType(val as any)}
            placeholder={t('placeholder_type')}
            isSearchable={false}
          />
        </div>

      </div>

      {/* 3. DATA CARD GRID (2-column grid xl:grid-cols-2 with 24px gap-6) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* CARD 1: INPUT DETAILS (padding p-6, rounded-2xl, card-shadow) */}
        <section className="bg-card border border-border-color rounded-2xl p-6 shadow-none space-y-5 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border-color/60">
          {/* Card Header: 48px avatar, title, subtitle, top-right status badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm font-mono uppercase">
                {currentStudent ? currentStudent.name.substring(0, 2).toUpperCase() : 'LS'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-black leading-tight">
                  {currentStudent ? currentStudent.name : (locale === 'id' ? 'Pilih Murid' : 'Select Student')}
                </h3>
                <p className="text-xs text-neutral-550 font-medium">
                  {currentStudent ? currentStudent.subject : (locale === 'id' ? 'Pelajaran les privat' : 'Private tutoring subject')}
                </p>
              </div>
            </div>

            {/* Status Badge: Compact, color-coded, 10px bold uppercase */}
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-black border border-black/10 font-mono">
              {locale === 'id' ? 'PERTEMUAN' : 'MEETING'} {meetingNumber}
            </span>
          </div>

          {/* Form Body */}
          <div className="space-y-5 pt-2">

            {/* Manual Meeting Number & Date Override */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-black/10 focus-within:border-black focus-within:shadow-[0_0_0_1px_#000000] rounded-xl p-3 bg-white transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/20">
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-1">
                  {locale === 'id' ? 'Pertemuan Ke-' : 'Meeting Number'}
                </label>
                <div className="relative flex items-center">
                  <span className="text-neutral-400 font-mono text-xs mr-1">#</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={meetingNumber}
                    onChange={(e) => setMeetingNumber(Number(e.target.value))}
                    className="w-full bg-transparent border-0 p-0 text-xs text-black font-semibold focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border border-black/10 focus-within:border-black focus-within:shadow-[0_0_0_1px_#000000] rounded-xl p-3 bg-white transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/20">
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-1">
                  {locale === 'id' ? 'Tanggal Laporan' : 'Report Date'}
                </label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-xs text-black font-semibold focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Material Area */}
            <div className="border border-black/10 focus-within:border-black focus-within:shadow-[0_0_0_1px_#000000] rounded-xl p-4 bg-white transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/20">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-1.5">
                {t('label_material')}
              </label>
              <textarea
                required
                rows={3}
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder={t('placeholder_material')}
                className="w-full bg-transparent border-0 p-0 text-xs text-black leading-relaxed focus:ring-0 focus:outline-none resize-y min-h-[70px]"
              />
            </div>

            {/* Behavior Area */}
            <div className="border border-black/10 focus-within:border-black focus-within:shadow-[0_0_0_1px_#000000] rounded-xl p-4 bg-white transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/20">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-1.5">
                {t('label_behavior')}
              </label>
              <textarea
                required
                rows={3}
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder={t('placeholder_behavior')}
                className="w-full bg-transparent border-0 p-0 text-xs text-black leading-relaxed focus:ring-0 focus:outline-none resize-y min-h-[70px]"
              />
            </div>

            {/* Optional Image Upload */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">
                <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                {locale === 'id' ? 'Foto Progres (Opsional)' : 'Progress Photo (Optional)'}
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="hidden"
              />
              
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-black/10 hover:border-black/30 bg-neutral-50/30 hover:bg-neutral-50/85 rounded-xl p-6 text-center cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] group"
                >
                  <ImageIcon className="w-6 h-6 text-neutral-400 mx-auto mb-2 group-hover:text-black transition-colors" />
                  <p className="text-xs font-bold text-black font-mono uppercase tracking-wider">
                    {locale === 'id' ? 'Pilih Gambar' : 'Choose Image'}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {locale === 'id' ? 'Klik untuk mencari foto dari perangkat' : 'Click to select photo from device'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-black/10 bg-white rounded-xl shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-black/5 bg-neutral-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={URL.createObjectURL(selectedImage)} 
                        alt="Preview" 
                        className="w-full h-full object-cover filter grayscale contrast-115"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-black truncate max-w-[150px] sm:max-w-[250px]">
                        {selectedImage.name}
                      </p>
                      <p className="text-[10px] text-neutral-450 font-mono font-bold">
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Card Footer: Generate trigger Button */}
          <div className="pt-2 border-t border-border-color">
            <button
              type="submit"
              onClick={handleGenerate}
              disabled={generating || !selectedStudentId}
              className="w-full bg-primary hover:bg-primary/80 disabled:bg-neutral-200 disabled:text-neutral-450 text-background text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-background" />
                  <span>{t('btn_generating')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-background" />
                  <span>{t('btn_generate')}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* CARD 2: EDITOR & SAVE (padding p-6, rounded-2xl, card-shadow) */}
        <section className="bg-card border border-border-color rounded-2xl p-6 shadow-none space-y-5 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border-color/60">
          
          {/* Card Header: 48px avatar, title, subtitle, top-right status badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-background animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary leading-tight">{locale === 'id' ? 'Draf Hasil Laporan' : 'Draft Report Result'}</h3>
                <p className="text-xs text-text-secondary font-medium">
                  {generatedText 
                    ? (locale === 'id' ? 'Draf AI berhasil dibuat' : 'AI draft created successfully') 
                    : (locale === 'id' ? 'Belum ada draf terbuat' : 'No draft created yet')}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
              generatedText 
                ? 'bg-primary text-background' 
                : 'border border-border-color text-text-primary bg-card'
            }`}>
              {generatedText ? 'READY' : 'EMPTY'}
            </span>
          </div>

          {/* Form Body / Content Area */}
          <div className="space-y-4 min-h-[295px] flex flex-col justify-between">
            {!generatedText && !generating && (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-text-secondary border border-dashed border-border-color rounded-xl min-h-[200px]">
                <Sparkles className="w-8 h-8 text-text-secondary/60 mb-2" />
                <span className="text-xs font-bold text-text-secondary font-mono">{locale === 'id' ? 'Menunggu Pembuatan Laporan' : 'Waiting for Report Generation'}</span>
                <p className="text-[10px] text-text-secondary/80 mt-1 max-w-[250px]">
                  {locale === 'id' 
                    ? 'Pilih murid dan isi deskripsi materi di sebelah kiri, lalu klik tombol Generate.' 
                    : 'Select a student and fill out the lesson details on the left, then click Generate.'}
                </p>
              </div>
            )}

            {generating && (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-text-secondary bg-card border border-dashed border-border-color rounded-xl min-h-[200px] space-y-2">
                <Loader2 className="w-7 h-7 text-text-primary animate-spin" />
                <span className="text-xs font-bold text-text-secondary font-mono">{locale === 'id' ? 'Memproses...' : 'Processing...'}</span>
                <p className="text-[10px] text-text-secondary/80 mt-1 max-w-[220px]">
                  {locale === 'id' 
                    ? 'AI sedang mencocokkan materi dengan contoh dataset Anda.' 
                    : 'AI is matching lesson details with your writing style dataset.'}
                </p>
              </div>
            )}

            {generatedText && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                {warningMsg && (
                  <div className="bg-card border border-border-color text-text-primary text-[10px] px-3.5 py-2 rounded-xl flex gap-2 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-text-primary" />
                    <span>{warningMsg}</span>
                  </div>
                )}

                {/* Edit content textarea */}
                <div className="flex-1 flex flex-col">
                  <textarea
                    rows={10}
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    className="w-full flex-1 bg-card border border-border-color rounded-xl p-4 text-xs text-text-primary font-mono leading-relaxed focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)] resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card Footer: Save Trigger Button */}
          {generatedText && (
            <div className="pt-2 border-t border-border-color">
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/80 disabled:bg-neutral-200 disabled:text-neutral-450 text-background text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-none flex items-center justify-center gap-2 cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-background" />
                    <span>{t('btn_saving')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-background" />
                    <span>{t('btn_save')}</span>
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
