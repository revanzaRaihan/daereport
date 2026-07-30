'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { syncPendingReports } from '@/lib/schedule/syncPendingReports'
import CustomSelect from '@/components/CustomSelect'
import CustomDatePicker from '@/components/CustomDatePicker'
import { useTranslation } from '@/components/LocaleProvider'
import { 
  Users, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  GraduationCap, 
  Clock, 
  Check, 
  Loader2,
  X,
  Search,
  BookOpen
} from 'lucide-react'

const DAYS_MAP: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu'
}

const DAYS_MAP_EN: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday'
}

export default function StudentsAndSchedulesPage() {
  const supabase = createClient()
  const { t, locale } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'students' | 'schedules'>('students')

  // Loaders & Errors
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Data States
  const [students, setStudents] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Student Form States
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [studentName, setStudentName] = useState('')
  const [studentSubject, setStudentSubject] = useState('')
  const [studentFirstMeeting, setStudentFirstMeeting] = useState('')
  const [studentMeetingCount, setStudentMeetingCount] = useState<number>(0)

  // Schedule Form States
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null)
  const [schedDay, setSchedDay] = useState<number>(1)
  const [schedStart, setSchedStart] = useState('')
  const [schedEnd, setSchedEnd] = useState('')
  const [schedLabel, setSchedLabel] = useState('')
  const [schedStudentIds, setSchedStudentIds] = useState<string[]>([])
  const [schedStudentSearchQuery, setSchedStudentSearchQuery] = useState('')

  // Fetch all data
  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // 1. Fetch Students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .order('name')
        setStudents(studentsData || [])

        // 2. Fetch Schedules
        const { data: schedulesData } = await supabase
          .from('schedules')
          .select('*, schedule_student(student_id)')
          .eq('user_id', user.id)
          .order('day_of_week')
          .order('start_time')
        setSchedules(schedulesData || [])
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

  const triggerToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message)
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      setErrorMsg(message)
      setTimeout(() => setErrorMsg(''), 4000)
    }
  }

  // --- STUDENT ACTIONS ---
  const handleOpenStudentModal = (student: any | null = null) => {
    setEditingStudent(student)
    if (student) {
      setStudentName(student.name)
      setStudentSubject(student.subject)
      setStudentFirstMeeting(student.first_meeting_date || '')
      setStudentMeetingCount(student.meeting_count || 0)
    } else {
      setStudentName('')
      setStudentSubject('')
      setStudentFirstMeeting('')
      setStudentMeetingCount(0)
    }
    setShowStudentModal(true)
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

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

      if (editingStudent) {
        // Edit
        const { error } = await supabase
          .from('students')
          .update({
            name: studentName,
            subject: studentSubject,
            first_meeting_date: studentFirstMeeting || null,
            meeting_count: studentMeetingCount
          })
          .eq('id', editingStudent.id)

        if (error) throw error
        triggerToast('success', 'Data murid berhasil diperbarui.')
      } else {
        // Create
        const { error } = await supabase
          .from('students')
          .insert({
            name: studentName,
            subject: studentSubject,
            first_meeting_date: studentFirstMeeting || null,
            meeting_count: studentMeetingCount,
            user_id: currentUserId
          })

        if (error) throw error
        triggerToast('success', 'Murid baru berhasil ditambahkan.')
      }
      setShowStudentModal(false)
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menyimpan data murid.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus murid ini? Riwayat laporan juga akan terpengaruh.')) return

    try {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
      triggerToast('success', 'Murid berhasil dihapus.')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menghapus murid.')
    }
  }

  // --- SCHEDULE ACTIONS ---
  const handleOpenScheduleModal = (sched: any | null = null) => {
    setEditingSchedule(sched)
    setSchedStudentSearchQuery('')
    if (sched) {
      setSchedDay(sched.day_of_week)
      setSchedStart(sched.start_time.substring(0, 5))
      setSchedEnd(sched.end_time.substring(0, 5))
      setSchedLabel(sched.label || '')
      setSchedStudentIds(sched.schedule_student?.map((s: any) => s.student_id) || [])
    } else {
      setSchedDay(1)
      setSchedStart('')
      setSchedEnd('')
      setSchedLabel('')
      setSchedStudentIds([])
    }
    setShowScheduleModal(true)
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    if (!schedStart || !schedEnd) {
      triggerToast('error', locale === 'id' ? 'Jam mulai dan jam selesai harus diisi.' : 'Start and end times are required.')
      setSubmitting(false)
      return
    }

    if (schedStart >= schedEnd) {
      triggerToast('error', locale === 'id' ? 'Jam mulai harus sebelum jam selesai.' : 'Start time must be before end time.')
      setSubmitting(false)
      return
    }

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

      let scheduleId = editingSchedule?.id

      if (editingSchedule) {
        // Edit Schedule Table
        const { error } = await supabase
          .from('schedules')
          .update({
            day_of_week: schedDay,
            start_time: schedStart,
            end_time: schedEnd,
            label: schedLabel
          })
          .eq('id', scheduleId)

        if (error) throw error

        // Delete existing relations
        await supabase.from('schedule_student').delete().eq('schedule_id', scheduleId)
      } else {
        // Create Schedule Table
        const newScheduleId = typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = Math.random() * 16 | 0
              const v = c === 'x' ? r : (r & 0x3 | 0x8)
              return v.toString(16)
            })

        const { data, error } = await supabase
          .from('schedules')
          .insert({
            id: newScheduleId,
            day_of_week: schedDay,
            start_time: schedStart,
            end_time: schedEnd,
            label: schedLabel,
            user_id: currentUserId
          })
          .select()
          .single()

        if (error) throw error
        scheduleId = data.id
      }

      // Sync/Insert new Relations into schedule_student
      if (schedStudentIds.length > 0) {
        const relations = schedStudentIds.map(sid => ({
          schedule_id: scheduleId,
          student_id: sid
        }))
        const { error: relErr } = await supabase.from('schedule_student').insert(relations)
        if (relErr) throw relErr
      }

      // Sync pending reports
      if (currentUserId) {
        await syncPendingReports(supabase, currentUserId)
      }

      triggerToast('success', 'Jadwal belajar berhasil disimpan.')
      setShowScheduleModal(false)
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menyimpan jadwal.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (error) throw error
      triggerToast('success', 'Jadwal berhasil dihapus.')
      fetchData()
    } catch (err: any) {
      triggerToast('error', err.message || 'Gagal menghapus jadwal.')
    }
  }

  const toggleStudentSelection = (sid: string) => {
    if (schedStudentIds.includes(sid)) {
      setSchedStudentIds(schedStudentIds.filter(id => id !== sid))
    } else {
      setSchedStudentIds([...schedStudentIds, sid])
    }
  }

  // Filters
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Primary Content Header (Height: 64px, flex items-center justify-between) */}
      <div className="h-16 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-black tracking-tighter uppercase font-editorial-headline">{t('students_title')}</h2>
          <div className="h-4 w-px bg-black/10" />
          <span className="text-xs font-medium text-neutral-500 font-mono tracking-wider">
            {activeTab === 'students' 
              ? `${students.length} ${t('nav_students')}` 
              : `${schedules.length} ${locale === 'id' ? 'Jadwal' : 'Schedules'}`}
          </span>
        </div>

        {/* Tab Buttons & Add Button */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-100 border border-black/5 p-1 rounded-xl flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'students' ? 'bg-black text-white font-bold' : 'text-neutral-500 hover:text-black'
              }`}
            >
              {t('tab_students')}
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schedules' ? 'bg-black text-white font-bold' : 'text-neutral-500 hover:text-black'
              }`}
            >
              {t('tab_schedules')}
            </button>
          </div>

          <button
            onClick={() => activeTab === 'students' ? handleOpenStudentModal() : handleOpenScheduleModal()}
            className="bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-none cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'id' ? 'Tambah' : 'Add'}</span>
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

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t('placeholder_search_student')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input-premium pl-10 shadow-none"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="border border-dashed border-black/10 bg-white rounded-2xl p-12 text-center text-neutral-400 shadow-none">
                  <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="font-bold text-sm text-black font-mono uppercase tracking-wider">
                    {locale === 'id' ? 'Belum Ada Data Murid' : 'No Student Data Yet'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {locale === 'id' 
                      ? 'Silakan klik tombol Tambah untuk mendaftarkan murid baru.' 
                      : 'Please click the Add button to register a new student.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-none">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/10 text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-50 font-mono">
                        <th className="p-4">{t('label_student_name')}</th>
                        <th className="p-4">{t('label_student_subject')}</th>
                        <th className="p-4">{locale === 'id' ? 'Tanggal Mulai' : 'Start Date'}</th>
                        <th className="p-4 text-center">{t('label_student_meet_count')}</th>
                        <th className="p-4 text-right">{locale === 'id' ? 'Aksi' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 text-sm text-neutral-700">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]">
                          <td className="p-4 font-bold text-black">{s.name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-black/5 text-black text-xs font-semibold rounded-xl font-mono uppercase">
                              <BookOpen className="w-3.5 h-3.5" />
                              {s.subject}
                            </span>
                          </td>
                          <td className="p-4 text-neutral-500 font-mono text-xs">{s.first_meeting_date || '-'}</td>
                          <td className="p-4 text-center font-bold text-black font-mono">{s.meeting_count || 0}</td>
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenStudentModal(s)}
                              className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title={t('btn_edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer font-bold"
                              title={t('btn_delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULES */}
          {activeTab === 'schedules' && (
            <div>
              {schedules.length === 0 ? (
                <div className="border border-dashed border-black/10 bg-white rounded-2xl p-12 text-center text-neutral-400 shadow-none">
                  <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="font-bold text-sm text-black font-mono uppercase tracking-wider">
                    {locale === 'id' ? 'Belum Ada Jadwal Belajar' : 'No Lesson Schedules Yet'}
                  </p>
                  <p className="text-xs text-neutral-550 mt-1">
                    {locale === 'id' 
                      ? 'Klik tombol Tambah untuk membuat jadwal belajar dan menugaskannya ke murid.' 
                      : 'Click the Add button to create a lesson schedule and assign it to students.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {schedules.map((sched) => {
                    const assignedStudents = (sched.schedule_student || [])
                      .map((rel: any) => students.find(s => s.id === rel.student_id)?.name)
                      .filter(Boolean)

                    return (
                      <div 
                        key={sched.id} 
                        className="bg-white border border-black/10 rounded-2xl p-5 shadow-none hover:border-black/35 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="px-2.5 py-1 bg-black border border-transparent text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl font-mono">
                              {locale === 'id' ? DAYS_MAP[sched.day_of_week] : DAYS_MAP_EN[sched.day_of_week]}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenScheduleModal(sched)}
                                className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(sched.id)}
                                className="text-neutral-400 hover:text-black p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-black font-bold text-base font-mono">
                              <Clock className="w-4 h-4 text-black" />
                              {sched.start_time.substring(0, 5)} - {sched.end_time.substring(0, 5)}
                            </div>
                            {sched.label && <p className="text-xs text-neutral-555 font-medium">{sched.label}</p>}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-black/15">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2 font-mono">
                            {locale === 'id' ? 'Murid Terdaftar' : 'Assigned Students'} ({assignedStudents.length})
                          </span>
                          {assignedStudents.length === 0 ? (
                            <span className="text-xs text-neutral-400 italic">
                              {locale === 'id' ? 'Belum ada murid ditugaskan' : 'No students assigned yet'}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedStudents.map((name: string, i: number) => (
                                <span 
                                  key={i} 
                                  className="px-2.5 py-1 bg-neutral-100 border border-black/5 text-black text-xs font-semibold rounded-lg font-mono uppercase"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white border border-black/10 rounded-2xl p-6 shadow-none relative">
            <button 
              onClick={() => setShowStudentModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-black p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-black mb-6 uppercase tracking-wider font-mono">
              {editingStudent 
                ? (locale === 'id' ? 'Edit Data Murid' : 'Edit Student Details') 
                : (locale === 'id' ? 'Tambah Murid Baru' : 'Add New Student')}
            </h3>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {t('label_student_name')}
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Renziro"
                  className="form-input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {t('label_student_subject')}
                </label>
                <input
                  type="text"
                  required
                  value={studentSubject}
                  onChange={(e) => setStudentSubject(e.target.value)}
                  placeholder="Contoh: Scratch Level 1"
                  className="form-input-premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_student_first_meet')}
                  </label>
                  <CustomDatePicker
                    value={studentFirstMeeting}
                    onChange={(val) => setStudentFirstMeeting(val)}
                    placeholder="Pilih Tanggal Pertama"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_student_meet_count')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={studentMeetingCount}
                    onChange={(e) => setStudentMeetingCount(Number(e.target.value))}
                    className="form-input-premium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="bg-white border border-black/10 hover:bg-neutral-100 text-black font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-none cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t('btn_save_data')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white border border-black/10 rounded-2xl p-6 shadow-none relative">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-black p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-black mb-6 uppercase tracking-wider font-mono">
              {editingSchedule 
                ? (locale === 'id' ? 'Edit Jadwal Belajar' : 'Edit Lesson Schedule') 
                : (locale === 'id' ? 'Tambah Jadwal Baru' : 'Add New Schedule')}
            </h3>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {t('label_sched_day')}
                </label>
                <CustomSelect
                  options={Object.entries(DAYS_MAP).map(([key, name]) => ({ value: key, label: locale === 'id' ? name : DAYS_MAP_EN[Number(key)] }))}
                  value={String(schedDay)}
                  onChange={(val) => setSchedDay(Number(val))}
                  isSearchable={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_sched_start')}
                  </label>
                  <input
                    type="time"
                    required
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    className="form-input-premium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                    {t('label_sched_end')}
                  </label>
                  <input
                    type="time"
                    required
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    className="form-input-premium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {t('label_sched_label')}
                </label>
                <input
                  type="text"
                  value={schedLabel}
                  onChange={(e) => setSchedLabel(e.target.value)}
                  placeholder="Contoh: Zoom Link, atau Google Meet"
                  className="form-input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">
                  {t('label_sched_students')}
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={locale === 'id' ? 'Cari nama murid...' : 'Search student...'}
                    value={schedStudentSearchQuery}
                    onChange={(e) => setSchedStudentSearchQuery(e.target.value)}
                    className="form-input-premium pl-9 py-1.5 text-xs shadow-none"
                  />
                </div>
                <div className="border border-black/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-neutral-50/50">
                  {(() => {
                    const filtered = students.filter(s =>
                      s.name.toLowerCase().includes(schedStudentSearchQuery.toLowerCase()) ||
                      s.subject.toLowerCase().includes(schedStudentSearchQuery.toLowerCase())
                    )
                    if (filtered.length === 0) {
                      return (
                        <p className="text-xs text-neutral-400 italic py-1 text-center">
                          {locale === 'id' ? 'Tidak ada murid yang cocok' : 'No matching students'}
                        </p>
                      )
                    }
                    return filtered.map(s => {
                      const isChecked = schedStudentIds.includes(s.id)
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-xs font-semibold text-black cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(s.id)}
                            className="rounded text-black focus:ring-black h-4 w-4 border-black/15 accent-black"
                          />
                          <span>{s.name} ({s.subject})</span>
                        </label>
                      )
                    })
                  })()}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="bg-white border border-black/10 hover:bg-neutral-100 text-black font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-none cursor-pointer text-xs uppercase tracking-wider transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] font-mono"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t('btn_save_data')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

