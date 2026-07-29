'use client'

import { useState } from 'react'
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  Check, 
  User,
  Heart,
  Bookmark
} from 'lucide-react'

export interface ParsedReport {
  id: string
  meeting_number: number
  report_date: string
  materi: string
  behavior: string
  image_url: string | null
  lessonCompleted: string
  overview: string
  teachersNote: string
  trainingRecommendation: string
  parentNote: string
}

interface ParentDashboardProps {
  student: {
    id: string
    name: string
    subject: string
    meeting_count: number | null
  }
  reports: ParsedReport[]
}

export default function ParentDashboard({ student, reports }: ParentDashboardProps) {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  )

  const latestReport = reports[0] || null

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-black">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Brand Watermark Header */}
        <div className="flex justify-between items-center border-b border-black/10 pb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-black" />
            <span className="text-sm font-bold uppercase tracking-wider font-mono">DReport Studio</span>
          </div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest font-mono">Parent Portal</span>
        </div>

        {/* Student Profile Card (Retro modern style) */}
        <div className="bg-white border border-black rounded-3xl p-6 md:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                <User className="w-3.5 h-3.5" />
                Profil Murid
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black font-editorial-headline">
                {student.name}
              </h1>
            </div>
            
            {/* Total meetings pill */}
            <div className="bg-black text-white px-3.5 py-1.5 rounded-2xl flex flex-col items-center justify-center font-mono">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Selesai</span>
              <span className="text-lg font-bold">{student.meeting_count || 0} Pertemuan</span>
            </div>
          </div>

          <div className="h-px bg-black/10" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 bg-neutral-100 border border-black/5 px-3 py-1.5 rounded-xl">
              <BookOpen className="w-4 h-4 text-neutral-500" />
              <span>Program: <strong className="text-black">{student.subject}</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-100 border border-black/5 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>Status: <strong className="text-emerald-600">Aktif</strong></span>
            </div>
          </div>
        </div>

        {/* Latest Report Highlight */}
        {latestReport ? (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
              Laporan Pertemuan Terbaru
            </h2>

            <div className="bg-white border border-black rounded-3xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Card Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="bg-black text-white px-2.5 py-1 rounded-xl text-xs font-bold font-mono">
                    Pertemuan {latestReport.meeting_number}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(latestReport.report_date)}
                  </span>
                </div>
              </div>

              {/* Lesson Completed */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                  Materi yang Diselesaikan
                </span>
                <p className="text-black text-sm leading-relaxed bg-neutral-50 border border-black/5 p-4 rounded-2xl font-mono whitespace-pre-wrap">
                  {latestReport.lessonCompleted}
                </p>
              </div>

              {/* Teacher's Note & Recommendations */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                  Catatan Guru & Rekomendasi Latihan
                </span>
                <div className="bg-neutral-50 border border-black/5 p-4 rounded-2xl space-y-4 text-sm">
                  <div>
                    <h4 className="font-bold text-black flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-4 h-4 text-neutral-500" />
                      Evaluasi Belajar:
                    </h4>
                    <p className="text-neutral-700 leading-relaxed font-mono whitespace-pre-wrap pl-6">
                      {latestReport.teachersNote}
                    </p>
                  </div>
                  <div className="h-px bg-black/5" />
                  <div>
                    <h4 className="font-bold text-black flex items-center gap-1.5 mb-1.5">
                      <Bookmark className="w-4 h-4 text-neutral-500" />
                      Rekomendasi Latihan di Rumah:
                    </h4>
                    <p className="text-neutral-700 leading-relaxed font-mono whitespace-pre-wrap pl-6">
                      {latestReport.trainingRecommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Message */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                  Pesan Khusus Orang Tua
                </span>
                <div className="bg-emerald-50/50 border border-emerald-500/20 p-4 rounded-2xl flex gap-3 text-sm">
                  <Heart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-emerald-900 leading-relaxed font-mono whitespace-pre-wrap">
                    {latestReport.parentNote}
                  </p>
                </div>
              </div>

              {/* Progress image if exists */}
              {latestReport.image_url && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                    Foto Dokumentasi Kelas
                  </span>
                  <div className="rounded-2xl overflow-hidden border border-black/10 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={latestReport.image_url} 
                      alt="Progres Kelas" 
                      className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-black/10 rounded-3xl p-8 text-center text-neutral-500">
            Belum ada laporan pertemuan yang tersimpan untuk murid ini.
          </div>
        )}

        {/* Timeline of past reports */}
        {reports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4" />
              Timeline Laporan ({reports.length} Pertemuan)
            </h2>

            <div className="border border-black rounded-3xl bg-white overflow-hidden divide-y divide-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {reports.map((report) => {
                const isExpanded = expandedReportId === report.id
                return (
                  <div key={report.id} className="transition-all">
                    
                    {/* Accordion Trigger */}
                    <div 
                      onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                      className="flex items-center justify-between p-5 cursor-pointer hover:bg-neutral-50/50 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-black text-white px-2.5 py-1 rounded-xl text-xs font-bold font-mono">
                          Pertemuan {report.meeting_number}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(report.report_date)}
                        </span>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180 text-black' : ''
                        }`}
                      />
                    </div>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="p-5 border-t border-black bg-neutral-50/30 space-y-6">
                        
                        {/* Lesson Completed */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                            Materi yang Diselesaikan
                          </span>
                          <p className="text-black text-xs leading-relaxed bg-white border border-black/10 p-3.5 rounded-xl font-mono whitespace-pre-wrap shadow-none">
                            {report.lessonCompleted}
                          </p>
                        </div>

                        {/* Teacher's Note & Recommendations */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                            Catatan Guru & Rekomendasi Latihan
                          </span>
                          <div className="bg-white border border-black/10 p-4 rounded-xl space-y-3.5 text-xs shadow-none">
                            <div>
                              <h4 className="font-bold text-black flex items-center gap-1.5 mb-1">
                                Evaluasi Belajar:
                              </h4>
                              <p className="text-neutral-700 leading-relaxed font-mono whitespace-pre-wrap">
                                {report.teachersNote}
                              </p>
                            </div>
                            <div className="h-px bg-black/5" />
                            <div>
                              <h4 className="font-bold text-black flex items-center gap-1.5 mb-1">
                                Rekomendasi Latihan di Rumah:
                              </h4>
                              <p className="text-neutral-700 leading-relaxed font-mono whitespace-pre-wrap">
                                {report.trainingRecommendation}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Parent Message */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                            Pesan Khusus Orang Tua
                          </span>
                          <div className="bg-emerald-50/50 border border-emerald-500/10 p-3.5 rounded-xl flex gap-3 text-xs">
                            <Heart className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-emerald-900 leading-relaxed font-mono whitespace-pre-wrap">
                              {report.parentNote}
                            </p>
                          </div>
                        </div>

                        {/* Documentation image if exists */}
                        {report.image_url && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">
                              Foto Dokumentasi Kelas
                            </span>
                            <div className="rounded-xl overflow-hidden border border-black/10 aspect-video max-w-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={report.image_url} 
                                alt="Progres Kelas" 
                                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
