'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { 
  LayoutDashboard, 
  FolderKanban, 
  TrendingUp, 
  Calculator, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Shield,
  Bell,
  Receipt,
  Package,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useState } from 'react'

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'PM', 'STAFF'] },
  { name: '프로젝트', href: '/projects', icon: FolderKanban, roles: ['ADMIN', 'PM'] },
  { name: '영업수주', href: '/sales', icon: TrendingUp, roles: ['ADMIN', 'PM'] },
  { name: '원가관리', href: '/cost', icon: Receipt, roles: ['ADMIN', 'PM'] },
  { name: '예산관리', href: '/budget', icon: Calculator, roles: ['ADMIN', 'PM'] },
  { name: '공사진행', href: '/progress', icon: BarChart3, roles: ['ADMIN', 'PM', 'STAFF'] },
  { name: '손익관리', href: '/finance', icon: DollarSign, roles: ['ADMIN', 'PM'] },
  { name: '인원리소스', href: '/resources', icon: Users, roles: ['ADMIN', 'PM'] },
  { name: '발주관리', href: '/orders', icon: Package, roles: ['ADMIN', 'PM'] },
  { name: '거래처', href: '/vendors', icon: Building2, roles: ['ADMIN', 'PM'] },
  { name: '알림', href: '/notifications', icon: Bell, roles: ['ADMIN', 'PM', 'STAFF'] },
]

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  PM: 'PM',
  STAFF: 'Staff',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500',
  PM: 'bg-blue-500',
  STAFF: 'bg-green-500',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const userRole = session?.user?.role as string | undefined
  const filteredNavigation = navigation.filter(
    item => !userRole || item.roles.includes(userRole)
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <span className="text-xl font-bold">PMS</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
              {session?.user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name || '사용자'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("w-2 h-2 rounded-full", roleColors[userRole || 'STAFF'])} />
                <p className="text-xs text-slate-400">{roleLabels[userRole || 'STAFF']}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
