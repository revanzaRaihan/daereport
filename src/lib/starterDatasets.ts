// =====================================================================
// STARTER DATASETS (DATASET GAYA & REKOMENDASI BAWAAN)
// =====================================================================

export interface StarterStyle {
  language: 'id' | 'en'
  section_type: 'overview' | 'teachers_note' | 'parent_note'
  body: string
}

export interface StarterRecommendation {
  language: 'id' | 'en'
  category: 'coding_dasar' | 'logika_terstruktur' | 'kreativitas' | 'eksperimen'
  body: string
}

export const STARTER_STYLES: StarterStyle[] = [
  // Bahasa Indonesia
  {
    language: 'id',
    section_type: 'overview',
    body: 'Pada pertemuan hari ini, siswa mengikuti materi dengan antusias dan fokus yang sangat baik. Siswa berhasil menyelesaikan seluruh tantangan proyek sesuai target sesi pembelajaran.'
  },
  {
    language: 'id',
    section_type: 'teachers_note',
    body: 'Pemahaman logika dan daya tangkap siswa sangat baik. Siswa mampu memahami alur instruksi secara mandiri dan cepat beradaptasi ketika menghadapi error pada kode.'
  },
  {
    language: 'id',
    section_type: 'parent_note',
    body: 'Tetap berikan dukungan dan apresiasi di rumah. Bimbing siswa untuk mengulang proyek atau mencoba tantangan serupa di waktu luang agar daya ingat konsep semakin kuat.'
  },
  // English
  {
    language: 'en',
    section_type: 'overview',
    body: "In today's session, the student showed great enthusiasm and deep focus throughout the lesson. The student successfully completed all core project milestones ahead of schedule."
  },
  {
    language: 'en',
    section_type: 'teachers_note',
    body: 'The student demonstrated strong logical thinking and problem-solving skills. When facing challenges, the student showed resilience and effectively debugged the issues independently.'
  },
  {
    language: 'en',
    section_type: 'parent_note',
    body: "Please continue encouraging the student at home. Reviewing today's completed project together will help reinforce the concepts learned during class."
  }
]

export const STARTER_RECOMMENDATIONS: StarterRecommendation[] = [
  // Bahasa Indonesia
  {
    language: 'id',
    category: 'coding_dasar',
    body: '1. Latihan Algoritma Blok: https://studio.code.org/\n2. Eksplorasi tantangan mini di rumah selama 15-20 menit untuk memperkuat pemahaman sekuens perintah.'
  },
  {
    language: 'id',
    category: 'logika_terstruktur',
    body: '1. Tantangan Puzzle Logika & Conditional: https://studio.code.org/courses\n2. Siswa dapat mencoba memecahkan teka-teki logika sederhana untuk mengasah pola pikir komputasional.'
  },
  // English
  {
    language: 'en',
    category: 'kreativitas',
    body: '1. Creative Sandbox Projects: Explore creating interactive stories or custom animations.\n2. Focus on designing unique characters and customizing color themes to boost creative expression.'
  },
  {
    language: 'en',
    category: 'eksperimen',
    body: "1. Hands-on Experimentation: Try modifying project parameters to observe different outcomes.\n2. Encourage testing 'what-if' scenarios to develop analytical thinking."
  }
]
