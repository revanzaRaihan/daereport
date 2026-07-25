import { SupabaseClient } from '@supabase/supabase-js'

export async function syncPendingReports(supabase: SupabaseClient, userId: string) {
  try {
    // 1. Fetch students for this user
    const { data: students, error: studentErr } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)

    if (studentErr || !students || students.length === 0) return

    const studentIds = students.map(s => s.id)

    // 2. Fetch schedules and schedule_student mapping
    const { data: schedules, error: schedErr } = await supabase
      .from('schedules')
      .select('id, day_of_week')
      .eq('user_id', userId)

    const { data: scheduleStudents, error: mapErr } = await supabase
      .from('schedule_student')
      .select('*')
      .in('student_id', studentIds)

    if (schedErr || mapErr || !schedules || !scheduleStudents) return

    // Group schedule days by student_id
    const schedulesMap = new Map<string, number[]>()
    for (const mapping of scheduleStudents) {
      const schedule = schedules.find(s => s.id === mapping.schedule_id)
      if (schedule) {
        const list = schedulesMap.get(mapping.student_id) || []
        list.push(schedule.day_of_week)
        schedulesMap.set(mapping.student_id, list)
      }
    }

    // 3. Fetch all reports and pending reports for in-memory comparisons
    const { data: allReports } = await supabase
      .from('reports')
      .select('id, student_id, report_date, meeting_number')
      .in('student_id', studentIds)
      .order('report_date', { ascending: false })

    const { data: allPending } = await supabase
      .from('pending_reports')
      .select('id, student_id, report_date, meeting_number')
      .in('student_id', studentIds)
      .order('report_date', { ascending: false })

    const reportsGroup = new Map<string, any[]>()
    allReports?.forEach(r => {
      const list = reportsGroup.get(r.student_id) || []
      list.push(r)
      reportsGroup.set(r.student_id, list)
    })

    const pendingGroup = new Map<string, any[]>()
    allPending?.forEach(p => {
      const list = pendingGroup.get(p.student_id) || []
      list.push(p)
      pendingGroup.set(p.student_id, list)
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pendingToCreate: any[] = []

    for (const student of students) {
      const scheduleDays = schedulesMap.get(student.id) || []
      if (scheduleDays.length === 0) continue

      const studentReports = reportsGroup.get(student.id) || []
      const studentPending = pendingGroup.get(student.id) || []

      const reportsByDate = new Set(studentReports.map(r => r.report_date))
      const pendingByDate = new Set(studentPending.map(p => p.report_date))

      const lastReport = studentReports[0] // Sorted desc, so first is latest

      let startDate: Date
      let startMeetingNumber: number

      if (lastReport) {
        startDate = new Date(lastReport.report_date)
        startMeetingNumber = Number(lastReport.meeting_number)
      } else if (student.first_meeting_date) {
        startDate = new Date(student.first_meeting_date)
        startDate.setDate(startDate.getDate() - 1)
        startMeetingNumber = Number(student.meeting_count || 0)
      } else {
        continue
      }

      startDate.setHours(0, 0, 0, 0)

      const checkDate = new Date(startDate)
      checkDate.setDate(checkDate.getDate() + 1)

      let nextMeetingNumber = startMeetingNumber + 1

      while (checkDate <= today) {
        const jsDay = checkDate.getDay()
        const dayOfWeekIso = jsDay === 0 ? 7 : jsDay // Convert Sunday to 7

        if (scheduleDays.includes(dayOfWeekIso)) {
          const year = checkDate.getFullYear()
          const month = String(checkDate.getMonth() + 1).padStart(2, '0')
          const day = String(checkDate.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`

          const reportExists = reportsByDate.has(dateStr)
          const pendingExists = pendingByDate.has(dateStr)

          if (!reportExists && !pendingExists) {
            pendingToCreate.push({
              student_id: student.id,
              meeting_number: nextMeetingNumber,
              report_date: dateStr
            })
          }
          nextMeetingNumber++
        }
        checkDate.setDate(checkDate.getDate() + 1)
      }
    }

    if (pendingToCreate.length > 0) {
      const { error: insertErr } = await supabase
        .from('pending_reports')
        .insert(pendingToCreate)
      if (insertErr) {
        console.error('Error inserting pending reports:', insertErr)
      }
    }
  } catch (e) {
    console.error('Error syncing pending reports:', e)
  }
}
