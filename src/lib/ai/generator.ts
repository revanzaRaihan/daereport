import { buildAiPrompt } from './promptBuilder'

export interface ReportSections {
  overview: string
  teachersNote: string
  trainingRecommendation: string
  parentNote: string
  lessonCompleted: string
}

export interface GeneratorResult {
  text: string
  warning: string | null
}

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}

/**
 * Port of ReportAssembler.assemble from PHP.
 */
export function assembleReport(
  student: { name: string; subject: string },
  meetingNumber: number,
  date: string,
  sections: ReportSections,
  language: 'id' | 'en' = 'id',
  reportType: 'full' | 'overview' = 'full'
): string {
  // Format date to DD/MM/YYYY
  let formattedDate = ''
  try {
    const dateObj = new Date(date)
    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    formattedDate = `${day}/${month}/${year}`
  } catch (e) {
    formattedDate = date
  }

  const line1 = formattedDate
  const lessonText = (sections.lessonCompleted || '').trim()
  let line2 = ''

  if (lessonText) {
    if (language === 'en') {
      line2 = `${student.subject} Meeting ${meetingNumber}, In this meeting, ${student.name} completed ${lessonText}`
    } else {
      line2 = `${student.subject} Meeting ${meetingNumber}, Pada pertemuan kali ini, ${student.name} dapat menyelesaikan ${lessonText}`
    }
  } else {
    line2 = `${student.subject} Meeting ${meetingNumber}`
  }

  let overview = (sections.overview || '').trim()
  const subjectEscaped = escapeRegex(student.subject)
  
  // Clean double headers like "Code Xplorer Meeting 3..."
  const regex = new RegExp(`^(${subjectEscaped}|.+?)?\\s*(Meeting|Lesson)\\s*\\d+[\\s,.]*`, 'i')
  overview = overview.replace(regex, '')

  const line3 = overview

  if (reportType === 'overview') {
    return `${line1}\n${line2}\n${line3}`
  }

  const separator = '-'
  let teachersNote = (sections.teachersNote || '').trim()
  let trainingRec = (sections.trainingRecommendation || '').trim()
  let parentNote = (sections.parentNote || '').trim()

  if (trainingRec && !trainingRec.toLowerCase().includes('training rec:')) {
    trainingRec = `Training Rec:\n${trainingRec}`
  }

  const mandatoryPhrase = language === 'en'
    ? `${student.name} does not need to complete the exercises to the end.`
    : `${student.name} tidak perlu menyelesaikan latihan hingga akhir.`

  const hasDisclaimer = parentNote.toLowerCase().includes('tidak perlu menyelesaikan latihan') || 
                        parentNote.toLowerCase().includes('does not need to complete')

  if (!hasDisclaimer) {
    if (parentNote) {
      if (!/[.!?]$/.test(parentNote)) {
        parentNote += '.'
      }
      parentNote += ` ${mandatoryPhrase}`
    } else {
      parentNote = mandatoryPhrase
    }
  }

  return `${line1}\n${line2}\n${line3}\n${separator}\n${teachersNote}\n\n${trainingRec}\n\n${parentNote}`
}

function validateSections(sections: ReportSections) {
  const fields: Array<keyof ReportSections> = [
    'overview',
    'teachersNote',
    'trainingRecommendation',
    'parentNote',
    'lessonCompleted'
  ]

  for (const field of fields) {
    const value = sections[field]
    if (typeof value !== 'string') {
      throw new Error(`AI output field '${field}' must be a string.`)
    }

    const len = value.length
    const minLen = field === 'lessonCompleted' ? 3 : 5
    if (len < minLen || len > 3000) {
      throw new Error(`AI output field '${field}' has invalid length: ${len} characters (expected ${minLen}-3000).`)
    }

    // Strip HTML tag checks
    if (/<[^>]*>/g.test(value)) {
      throw new Error(`AI output field '${field}' contains forbidden HTML or script tags.`)
    }
  }
}

function isValidReport(sections: ReportSections): boolean {
  if (
    !sections.overview ||
    !sections.teachersNote ||
    !sections.trainingRecommendation ||
    !sections.parentNote ||
    !sections.lessonCompleted
  ) {
    return false
  }

  if (sections.overview.length < 30) return false
  if (sections.teachersNote.length < 15) return false
  if (sections.trainingRecommendation.length < 15) return false
  if (sections.parentNote.length < 15) return false
  if (sections.lessonCompleted.length < 3) return false

  return true
}

export async function classifyCategory(
  behavior: string,
  materi: string,
  provider: string,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = `Klasifikasikan materi dan behavior berikut ke dalam salah satu kategori: kreativitas, logika_terstruktur, eksperimen, coding_dasar.\n\nMateri: ${materi}\nBehavior: ${behavior}\n\nKembalikan HANYA JSON dengan key 'category' dan value nama kategori tersebut (contoh: {"category": "logika_terstruktur"}). Jangan ada penjelasan lain.`

  if (!apiKey) return 'coding_dasar'

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['kreativitas', 'logika_terstruktur', 'eksperimen', 'coding_dasar']
                }
              },
              required: ['category']
            }
          }
        })
      })

      if (!res.ok) return 'coding_dasar'
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) return 'coding_dasar'
      const parsed = JSON.parse(text)
      return parsed.category || 'coding_dasar'
    } else {
      // Groq
      const url = 'https://api.groq.com/openai/v1/chat/completions'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      })

      if (!res.ok) return 'coding_dasar'
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (!text) return 'coding_dasar'
      const parsed = JSON.parse(text)
      return parsed.category || 'coding_dasar'
    }
  } catch (e) {
    return 'coding_dasar'
  }
}

export async function generateReportSections(
  prompt: string,
  provider: string,
  apiKey: string,
  model: string
): Promise<ReportSections> {
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              overview: { type: 'string' },
              teachersNote: { type: 'string' },
              trainingRecommendation: { type: 'string' },
              parentNote: { type: 'string' },
              lessonCompleted: { type: 'string' }
            },
            required: ['overview', 'teachersNote', 'trainingRecommendation', 'parentNote', 'lessonCompleted']
          }
        }
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || `HTTP error ${res.status}`
      throw new Error(`Gemini API Error: ${errorMsg}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini API returned an empty response.')

    return JSON.parse(text) as ReportSections
  } else {
    // Groq
    const url = 'https://api.groq.com/openai/v1/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || `HTTP error ${res.status}`
      throw new Error(`Groq API Error: ${errorMsg}`)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Groq API returned an empty response.')

    return JSON.parse(text) as ReportSections
  }
}
