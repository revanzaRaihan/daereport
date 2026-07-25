'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Sparkles, 
  Users, 
  BookOpen, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Lightbulb,
  FileText,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

const DAYS_MAP: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  // Auth & UI States
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // KPI & Metric States
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalReports, setTotalReports] = useState(0)
  const [studentProgressList, setStudentProgressList] = useState<any[]>([])

  const fetchKpis = async (userId: string) => {
    try {
      // 1. Total Students
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      setTotalStudents(studentCount || 0)

      // 2. Total Reports
      const { count: reportCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      setTotalReports(reportCount || 0)


      // 4. Student Progress List (top 4 students by meeting count)
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, subject, meeting_count')
        .eq('user_id', userId)
        .order('meeting_count', { ascending: false })
        .limit(4)
      setStudentProgressList(studentsData || [])

    } catch (e) {
      console.error('Error loading KPI data:', e)
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        await fetchKpis(user.id)
      }
      setLoading(false)
    }
    getUser()

    // Setup realtime subscription to refresh metrics when data changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) fetchKpis(user.id)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const navItems = [
    { name: 'Buat Laporan', href: '/', icon: Sparkles },
    { name: 'Murid', href: '/students', icon: Users },
    { name: 'Dataset Gaya', href: '/dataset', icon: BookOpen },
    { name: 'Riwayat', href: '/history', icon: History },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="h-screen bg-[#F8FAFC] text-[#0f172a] flex flex-col overflow-hidden font-sans">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between z-30 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Report Studio</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT NAVIGATION SIDEBAR (Width: 288px) */}
        <aside className={`
          absolute inset-y-0 left-0 z-20 w-72 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0
          transform md:translate-x-0 md:static md:flex transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Top Section: Logo & Tagline */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-950 text-base tracking-tight block leading-tight">Report Studio</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">AI LES PRIVAT</span>
              </div>
            </div>

            {/* Middle Section: Nav Links */}
            <nav className="p-4 space-y-1.5 flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-[#EFF6FF] text-blue-600' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100'}
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Bottom Section: Profile & Logout */}
          <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                  {userEmail ? getInitials(userEmail) : 'AI'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Pengajar</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[130px] font-mono">{userEmail || 'Memuat...'}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER PRIMARY CONTENT (Scrollable Area) */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
