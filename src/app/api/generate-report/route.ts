import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { buildAiPrompt } from '@/lib/ai/promptBuilder'
import { classifyCategory, generateReportSections, assembleReport, ReportSections } from '@/lib/ai/generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const {
      student_id,
      meeting_number,
      report_date,
      materi,
      behavior,
      language = 'id',
      report_type = 'full'
    } = body

    if (!student_id || !meeting_number || !report_date || !materi || !behavior) {
      return NextResponse.json({ success: false, message: 'Missing required parameters.' }, { status: 422 })
    }

    // 3. Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', student_id)
      .eq('user_id', user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 })
    }

    // 4. Fetch settings
    const { data: settingsData } = await supabase.from('app_settings').select('key, value')
    const settings = new Map(settingsData?.map(s => [s.key, s.value]) || [])

    const provider = settings.get('ai_provider') || process.env.AI_PROVIDER || 'gemini'
    const apiKey = settings.get('ai_api_key') || process.env.AI_API_KEY
    const model = settings.get('ai_model') || (provider === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.1-8b-instant') // default models

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'API Key AI belum dikonfigurasi di Pengaturan.'
      }, { status: 400 })
    }

    // 5. Check if at least one dataset entry exists for the selected language
    const { count, error: countError } = await supabase
      .from('dataset_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('language', language)

    if (countError || count === null || count === 0) {
      const langName = language === 'en' ? 'Bahasa Inggris' : 'Bahasa Indonesia'
      return NextResponse.json({
        success: false,
        message: `Silakan tambah minimal 1 contoh di tab Dataset Gaya untuk ${langName} biar AI tahu gaya nulis kamu.`
      }, { status: 422 })
    }

    // 6. Classify Student Behavior
    const category = await classifyCategory(behavior, materi, provider, apiKey, model)

    // 7. Generate report sections with retries (max 2 attempts)
    const maxAttempts = 2
    let attempt = 0
    let reportSections: ReportSections | null = null
    let lastError: string | null = null

    while (attempt < maxAttempts) {
      attempt++
      try {
        const prompt = await buildAiPrompt({
          supabase,
          student,
          meetingNo: meeting_number,
          dateVal: report_date,
          materi,
          behavior,
          category,
          language
        })

        reportSections = await generateReportSections(prompt, provider, apiKey, model)

        // Validate structure and basic length constraints
        if (
          reportSections &&
          reportSections.overview &&
          reportSections.overview.length >= 30 &&
          reportSections.teachersNote &&
          reportSections.teachersNote.length >= 15 &&
          reportSections.trainingRecommendation &&
          reportSections.trainingRecommendation.length >= 15 &&
          reportSections.parentNote &&
          reportSections.parentNote.length >= 15 &&
          reportSections.lessonCompleted &&
          reportSections.lessonCompleted.length >= 3
        ) {
          break // Success
        }
        
        lastError = `Hasil generate terlalu pendek pada percobaan ke-${attempt}.`
      } catch (e: any) {
        lastError = e.message || 'Error generating report sections'
      }
    }

    if (!reportSections) {
      return NextResponse.json({
        success: false,
        message: `Gagal menghasilkan laporan terstruktur: ${lastError || 'Alasan tidak diketahui'}`
      }, { status: 500 })
    }

    // 8. Assemble sections
    const outputText = assembleReport(student, meeting_number, report_date, reportSections, language, report_type)

    // Warning flag if validation parameters were not fully met on final try
    let warning: string | null = null
    const isStillShort = reportSections.overview.length < 30 ||
                         reportSections.teachersNote.length < 15 ||
                         reportSections.trainingRecommendation.length < 15 ||
                         reportSections.parentNote.length < 15 ||
                         reportSections.lessonCompleted.length < 3
                         
    if (isStillShort) {
      warning = 'Hasil generate laporan terindikasi terlalu pendek. Silakan periksa kembali hasil generate.'
    }

    return NextResponse.json({
      success: true,
      text: outputText,
      warning,
      student_id: student.id,
      student_name: student.name,
      subject: student.subject,
      meeting_number,
      report_date,
      materi,
      behavior
    })

  } catch (error: any) {
    console.error('AI Generation API Exception:', error)
    return NextResponse.json({
      success: false,
      message: 'Maaf, terjadi kesalahan sistem saat memproses laporan dengan AI. Silakan coba kembali.'
    }, { status: 500 })
  }
}
