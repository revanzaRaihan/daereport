'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'
import { useTranslation } from '@/components/LocaleProvider'
import { 
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
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

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
  const { t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()
  
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
    { name: t('nav_create_report'), href: '/', icon: Logo },
    { name: t('nav_students'), href: '/students', icon: Users },
    { name: t('nav_dataset'), href: '/dataset', icon: BookOpen },
    { name: t('nav_history'), href: '/history', icon: History },
    { name: t('nav_settings'), href: '/settings', icon: Settings },
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col overflow-hidden font-sans">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-card border-b border-border-color px-4 py-3 flex items-center justify-between z-30 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 text-text-primary flex items-center justify-center">
            <Logo className="w-6 h-6" />
          </div>
          <span className="font-bold text-text-primary text-sm tracking-tight">Report Studio</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT NAVIGATION SIDEBAR (Width: 288px) */}
        <aside className={`
          absolute inset-y-0 left-0 z-20 w-72 bg-card border-r border-border-color flex flex-col justify-between shrink-0
          transform md:translate-x-0 md:static md:flex transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Top Section: Logo & Tagline */}
            <div className="p-6 border-b border-border-color flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 text-text-primary flex items-center justify-center">
                <Logo className="w-8 h-8" />
              </div>
              <div>
                <span className="font-extrabold text-text-primary text-base tracking-tight block leading-tight">Report Studio</span>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mt-0.5">{t('nav_role')} AI</span>
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
                      flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]
                      ${isActive 
                        ? 'bg-primary text-background font-bold' 
                         : 'text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent'}
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-background' : 'text-text-secondary group-hover:text-text-primary'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Bottom Section: Profile & Logout */}
          <div className="p-4 border-t border-border-color space-y-3 bg-card">
            <div className="flex items-center justify-between p-3 bg-card border border-border-color rounded-xl shadow-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center text-xs font-bold font-mono">
                  {userEmail ? getInitials(userEmail) : 'AI'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{t('nav_role')}</p>
                  <p className="text-[10px] text-text-secondary truncate max-w-[110px] font-mono">{userEmail || 'Memuat...'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleTheme}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
                  title={t('nav_logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER PRIMARY CONTENT (Scrollable Area) */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-background">
          <div className="p-6 md:p-8 flex-1 bg-background text-text-primary">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
