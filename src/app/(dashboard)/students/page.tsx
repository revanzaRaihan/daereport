'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { syncPendingReports } from '@/lib/schedule/syncPendingReports'
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

export default function StudentsAndSchedulesPage() {
  const supabase = createClient()
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
            user_id: userId
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

    try {
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
        const { data, error } = await supabase
          .from('schedules')
          .insert({
            day_of_week: schedDay,
            start_time: schedStart,
            end_time: schedEnd,
            label: schedLabel,
            user_id: userId
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
      if (userId) {
        await syncPendingReports(supabase, userId)
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
      <div className="h-16 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kelola Murid & Jadwal</h2>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-sm font-medium text-slate-500">
            {activeTab === 'students' ? `${students.length} Murid` : `${schedules.length} Jadwal`}
          </span>
        </div>

        {/* Tab Buttons & Add Button */}
        <div className="flex items-center gap-3">
          <div className="bg-[#EFF6FF] border border-blue-100 p-1 rounded-xl flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'students' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Murid
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schedules' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Jadwal Les
            </button>
          </div>

          <button
            onClick={() => activeTab === 'students' ? handleOpenStudentModal() : handleOpenScheduleModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-200/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
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

      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama murid atau mata pelajaran..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors shadow-card"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="border border-dashed border-[#E2E8F0] bg-white rounded-2xl p-12 text-center text-slate-400 shadow-card">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-sm text-slate-700">Belum Ada Data Murid</p>
                  <p className="text-xs text-slate-400 mt-1">Silakan klik tombol Tambah untuk mendaftarkan murid baru.</p>
                </div>
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50">
                        <th className="p-4">Nama Murid</th>
                        <th className="p-4">Mata Pelajaran / Kelas</th>
                        <th className="p-4">Tanggal Mulai</th>
                        <th className="p-4 text-center">Jumlah Meeting</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{s.name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold rounded-xl">
                              <BookOpen className="w-3.5 h-3.5" />
                              {s.subject}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-mono text-xs">{s.first_meeting_date || '-'}</td>
                          <td className="p-4 text-center font-bold text-slate-800 font-mono">{s.meeting_count || 0}</td>
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenStudentModal(s)}
                              className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
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
                <div className="border border-dashed border-[#E2E8F0] bg-white rounded-2xl p-12 text-center text-slate-400 shadow-card">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-sm text-slate-700">Belum Ada Jadwal Belajar</p>
                  <p className="text-xs text-slate-400 mt-1">Klik tombol Tambah untuk membuat jadwal belajar dan menugaskannya ke murid.</p>
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
                        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-card hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-widest rounded-xl">
                              {DAYS_MAP[sched.day_of_week]}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenScheduleModal(sched)}
                                className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(sched.id)}
                                className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-base font-mono">
                              <Clock className="w-4 h-4 text-blue-600" />
                              {sched.start_time.substring(0, 5)} - {sched.end_time.substring(0, 5)}
                            </div>
                            {sched.label && <p className="text-xs text-slate-400 font-medium">{sched.label}</p>}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                            Murid Terdaftar ({assignedStudents.length})
                          </span>
                          {assignedStudents.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Belum ada murid ditugaskan</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedStudents.map((name: string, i: number) => (
                                <span 
                                  key={i} 
                                  className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowStudentModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-6">
              {editingStudent ? 'Edit Data Murid' : 'Tambah Murid Baru'}
            </h3>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nama Murid
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Renziro"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Mata Pelajaran / Kelas
                </label>
                <input
                  type="text"
                  required
                  value={studentSubject}
                  onChange={(e) => setStudentSubject(e.target.value)}
                  placeholder="Contoh: Scratch Level 1"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Mulai Pertemuan Pertama
                  </label>
                  <input
                    type="date"
                    value={studentFirstMeeting}
                    onChange={(e) => setStudentFirstMeeting(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Jumlah Meeting
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={studentMeetingCount}
                    onChange={(e) => setStudentMeetingCount(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-200/50 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-6">
              {editingSchedule ? 'Edit Jadwal Belajar' : 'Tambah Jadwal Baru'}
            </h3>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Hari Belajar
                </label>
                <select
                  value={schedDay}
                  onChange={(e) => setSchedDay(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors font-semibold"
                >
                  {Object.entries(DAYS_MAP).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Label Info (Opsional)
                </label>
                <input
                  type="text"
                  value={schedLabel}
                  onChange={(e) => setSchedLabel(e.target.value)}
                  placeholder="Contoh: Jam Les Sore / Kelas Weekend"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-slate-800 text-sm h-[42px] focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Pilih Murid Untuk Jadwal Ini
                </label>
                {students.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">Harap tambahkan murid terlebih dahulu.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 max-h-36 overflow-y-auto">
                    {students.map(s => {
                      const isSelected = schedStudentIds.includes(s.id)
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleStudentSelection(s.id)}
                          className={`
                            flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer border
                            ${isSelected 
                              ? 'bg-blue-50 border-blue-200 text-blue-600' 
                              : 'bg-white border-transparent text-slate-600 hover:text-slate-900'}
                          `}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate">{s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-200/50 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

