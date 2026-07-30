import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Laporan Perkembangan Murid'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const slug = params.slug

  let studentName = 'Student Progress'
  let subject = 'Learning Report'
  let totalMeetings = 0

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      // Fetch all students to match slug (using standard fetch for Edge runtime compatibility)
      const res = await fetch(`${supabaseUrl}/rest/v1/students?select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 60 } // cache for 1 minute
      })

      if (res.ok) {
        const students = await res.json()
        const slugify = (text: string) => 
          text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')

        const student = students.find((s: any) => slugify(s.name) === slug)
        if (student) {
          studentName = student.name
          subject = student.subject
          
          // Fetch actual count of reports for this student
          const countRes = await fetch(`${supabaseUrl}/rest/v1/reports?student_id=eq.${student.id}&select=id`, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            next: { revalidate: 60 }
          })
          if (countRes.ok) {
            const reportsData = await countRes.json()
            totalMeetings = reportsData.length
          } else {
            totalMeetings = student.meeting_count || 0
          }
        }
      }
    }
  } catch (e) {
    console.error('OG Image generation data fetch failed:', e)
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f3f3f3 100%)',
          padding: '40px',
        }}
      >
        {/* Postcard Frame */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '1100px',
            height: '550px',
            backgroundColor: '#ffffff',
            borderRadius: '32px',
            border: '8px solid #000000',
            padding: '45px',
            position: 'relative',
            boxShadow: '16px 16px 0px 0px #000000',
          }}
        >
          {/* Postcard Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '6px solid #000000',
              paddingBottom: '30px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '3px', color: '#737373', fontFamily: 'monospace' }}>
                LAPORAN PROGRES BELAJAR MURID
              </span>
              <span style={{ fontSize: '46px', fontWeight: '900', color: '#000000', marginTop: '8px' }}>
                {studentName}
              </span>
            </div>
            
            {/* Stamp-like indicator */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '6px dashed #000000',
                padding: '12px 24px',
                borderRadius: '16px',
                transform: 'rotate(2deg)',
                backgroundColor: '#fff',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#737373', fontFamily: 'monospace' }}>SELESAI</span>
              <span style={{ fontSize: '28px', fontWeight: '900', color: '#000' }}>{totalMeetings} MEET</span>
            </div>
          </div>

          {/* Postcard Body */}
          <div style={{ display: 'flex', flex: 1, marginTop: '35px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace' }}>
                PROGRAM BELAJAR
              </span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#000000', marginTop: '6px' }}>
                {subject}
              </span>
              
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace', marginTop: '30px' }}>
                STATUS
              </span>
              <span style={{ fontSize: '24px', fontWeight: '850', color: '#16a34a', marginTop: '6px', display: 'flex', alignItems: 'center' }}>
                Active & Progressing
              </span>
            </div>

            {/* Right side decoration */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', opacity: 0.08 }}>
              <span style={{ fontSize: '140px', fontWeight: '900' }}>🎓</span>
            </div>
          </div>

          {/* Footer watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '45px',
              fontSize: '16px',
              fontWeight: '900',
              color: '#d4d4d4',
              fontFamily: 'monospace',
            }}
          >
            dreport.studio
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
