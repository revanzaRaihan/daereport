import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import ParentDashboard, { ParsedReport } from './ParentDashboard'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

interface PageProps {
  params: Promise<{ slug: string }>
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

function parseReportContent(content: string, materi: string) {
  const lines = content.split('\n')
  
  // Find where the separator '-' is
  const separatorIndex = lines.indexOf('-')
  
  // Lesson line is usually line 1 (index 1)
  const lessonLine = lines[1] || ''
  
  // Overview is between line 2 and separator
  let overview = ''
  if (separatorIndex > 2) {
    overview = lines.slice(2, separatorIndex).join('\n').trim()
  } else if (separatorIndex === -1 && lines.length > 2) {
    overview = lines.slice(2, 5).join('\n').trim()
  }

  // After separator, we have the remaining text
  let remainingText = ''
  if (separatorIndex !== -1 && separatorIndex < lines.length - 1) {
    remainingText = lines.slice(separatorIndex + 1).join('\n').trim()
  } else {
    remainingText = content
  }

  // Look for "Training Rec:" (case insensitive)
  const trainingRecMatch = remainingText.match(/Training Rec:/i)
  
  let teachersNote = ''
  let trainingRec = ''
  let parentNote = ''

  if (trainingRecMatch && trainingRecMatch.index !== undefined) {
    teachersNote = remainingText.substring(0, trainingRecMatch.index).trim()
    const afterTrainingRec = remainingText.substring(trainingRecMatch.index).trim()
    
    const paragraphs = afterTrainingRec.split('\n\n')
    if (paragraphs.length >= 2) {
      trainingRec = paragraphs[0].replace(/Training Rec:\s*/i, '').trim()
      parentNote = paragraphs.slice(1).join('\n\n').trim()
    } else {
      trainingRec = afterTrainingRec.replace(/Training Rec:\s*/i, '').trim()
    }
  } else {
    const paragraphs = remainingText.split('\n\n')
    if (paragraphs.length >= 3) {
      teachersNote = paragraphs[0].trim()
      trainingRec = paragraphs[1].trim()
      parentNote = paragraphs.slice(2).join('\n\n').trim()
    } else if (paragraphs.length === 2) {
      teachersNote = paragraphs[0].trim()
      parentNote = paragraphs[1].trim()
    } else {
      teachersNote = remainingText
    }
  }

  // Clean up "Training Rec:" text if present inside the string itself
  trainingRec = trainingRec.replace(/Training Rec:\s*/i, '').trim()

  // Find the completed lesson part
  let lessonCompleted = ''
  const completedMatch = lessonLine.match(/(completed|menyelesaikan)\s+(.*)/i)
  if (completedMatch && completedMatch[2]) {
    lessonCompleted = completedMatch[2].trim()
  } else {
    lessonCompleted = lessonLine || materi
  }

  return {
    lessonCompleted,
    overview: overview || lessonLine,
    teachersNote: teachersNote || 'Tidak ada catatan.',
    trainingRecommendation: trainingRec || 'Tidak ada rekomendasi khusus.',
    parentNote: parentNote || 'Tetap dampingi belajar anak.'
  }
}

async function getStudentAndReports(slug: string) {
  const supabase = await createClient()

  // 1. Fetch all students (needed because we filter by slug in JS to avoid complex postgres slug logic)
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')

  if (studentError || !students) {
    return null
  }

  const student = students.find(s => slugify(s.name) === slug)
  if (!student) {
    return null
  }

  // 2. Fetch all reports for this student
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('student_id', student.id)
    .order('report_date', { ascending: false })
    .order('meeting_number', { ascending: false })

  const parsedReports: ParsedReport[] = (reports || []).map(r => {
    const parsed = parseReportContent(r.content, r.materi)
    return {
      id: r.id,
      meeting_number: r.meeting_number,
      report_date: r.report_date,
      materi: r.materi,
      behavior: r.behavior,
      image_url: r.image_url,
      ...parsed
    }
  })

  return {
    student: {
      id: student.id,
      name: student.name,
      subject: student.subject,
      meeting_count: student.meeting_count
    },
    reports: parsedReports
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getStudentAndReports(slug)
  
  if (!data) {
    return {
      title: 'Murid Tidak Ditemukan | DReport Studio',
      description: 'Laporan belajar tidak ditemukan.'
    }
  }

  return {
    title: `Laporan Progres Belajar ${data.student.name} | DReport Studio`,
    description: `Pantau perkembangan belajar ${data.student.name} untuk program ${data.student.subject} di DReport Studio.`,
    openGraph: {
      title: `Laporan Progres Belajar ${data.student.name}`,
      description: `Pantau riwayat progres, catatan guru, dan rekomendasi latihan untuk ${data.student.name}.`,
      type: 'website'
    }
  }
}

export default async function ParentPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getStudentAndReports(slug)

  if (!data) {
    notFound()
  }

  return (
    <div className={plusJakartaSans.variable}>
      <ParentDashboard student={data.student} reports={data.reports} />
    </div>
  )
}
