'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ClipboardList, 
  UserCheck, 
  Activity,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  userRole: 'SUPER_ADMIN' | 'ADMIN'
  isOpen?: boolean
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Kehadiran Dokter',
    href: '/attendance',
    icon: UserCheck,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Transaksi',
    href: '/transactions',
    icon: CreditCard,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Laporan',
    href: '/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Dokter',
    href: '/doctors',
    icon: Users,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Tindakan Medis',
    href: '/actions',
    icon: Activity,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Users',
    href: '/users',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN'],
  },
]

export function Sidebar({ userRole, isOpen = true }: SidebarProps) {
  const pathname = usePathname()

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(userRole)
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform',
        !isOpen && '-translate-x-full'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">
            Klinik<span className="text-primary/70">System</span>
          </h1>
          <p className="text-sm text-muted-foreground">Sistem Manajemen Klinik</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => {
              window.location.href = '/login'
            }}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
