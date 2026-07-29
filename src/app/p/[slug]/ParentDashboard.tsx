'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Calendar, 
  ChevronDown, 
  FileText, 
  GraduationCap
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
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-black">
      <div className="max-w-2xl mx-auto space-y-10">
        
        {/* Student Profile Identity Section (No watermark header, simple and clean profile) */}
        <div className="space-y-4 text-center pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10AF13]/10 text-[#10AF13] border border-[#10AF13]/25 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 font-editorial-headline">
              {student.name}
            </h1>
            <p className="text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#10AF13]" />
              {student.subject}
            </p>
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center px-4 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-2xl uppercase tracking-wider">
              {student.meeting_count || 0} Pertemuan Selesai
            </span>
          </div>
        </div>

        {/* Latest Report Highlight */}
        {latestReport ? (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10AF13] animate-ping" />
              Laporan Terbaru
            </h2>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-sm transition-all duration-350 hover:border-[#10AF13]/30">
              
              {/* Meeting Meta Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-[#10AF13] text-white px-3 py-1 rounded-xl text-xs font-extrabold">
                    Pertemuan {latestReport.meeting_number}
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(latestReport.report_date)}
                  </span>
                </div>
              </div>

              {/* Evaluasi Belajar Only */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#10AF13] uppercase tracking-widest block">
                  Evaluasi Belajar
                </span>
                <p className="text-neutral-800 text-sm leading-relaxed bg-neutral-50 border border-neutral-100 p-5 rounded-2xl whitespace-pre-wrap">
                  {latestReport.teachersNote}
                </p>
              </div>

              {/* Documentation image if exists */}
              {latestReport.image_url && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                    Dokumentasi Kelas
                  </span>
                  <div className="rounded-2xl overflow-hidden border border-neutral-100 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={latestReport.image_url} 
                      alt="Dokumentasi Kelas" 
                      className="w-full h-full object-cover filter contrast-105 hover:contrast-100 transition-all duration-550"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-neutral-100 rounded-3xl p-8 text-center text-neutral-400 text-xs">
            Belum ada laporan pertemuan yang tersimpan.
          </div>
        )}

        {/* Timeline of past reports */}
        {reports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#10AF13]" />
              Timeline Riwayat Kelas
            </h2>

            <div className="border border-neutral-200 rounded-3xl bg-white overflow-hidden divide-y divide-neutral-200 shadow-sm">
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
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition-colors duration-300 ${
                          isExpanded ? 'bg-[#10AF13] text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          Pertemuan {report.meeting_number}
                        </span>
                        <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(report.report_date)}
                        </span>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180 text-[#10AF13]' : ''
                        }`}
                      />
                    </div>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="p-5 border-t border-neutral-100 bg-neutral-50/30 space-y-4">
                        
                        {/* Evaluasi Belajar Only */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-[#10AF13] uppercase tracking-widest block">
                            Evaluasi Belajar
                          </span>
                          <p className="text-neutral-800 text-xs leading-relaxed bg-white border border-neutral-200 p-4 rounded-xl whitespace-pre-wrap">
                            {report.teachersNote}
                          </p>
                        </div>

                        {/* Documentation image if exists */}
                        {report.image_url && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">
                              Dokumentasi Kelas
                            </span>
                            <div className="rounded-xl overflow-hidden border border-neutral-200 aspect-video max-w-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={report.image_url} 
                                alt="Dokumentasi Kelas" 
                                className="w-full h-full object-cover filter contrast-105 hover:contrast-100 transition-all duration-550"
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
