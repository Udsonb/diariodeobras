'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  LayoutDashboard,
  HardHat,
  ClipboardList,
  Users,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: null },
  { href: '/obras', icon: HardHat, label: 'Obras', roles: null },
  { href: '/rdos', icon: ClipboardList, label: 'Diários (RDO)', roles: null },
  { href: '/efetivo', icon: Users, label: 'Efetivo', roles: ['admin', 'engenheiro', 'supervisor', 'tecnico'] },
  { href: '/maquinario', icon: Wrench, label: 'Maquinário', roles: ['admin', 'engenheiro', 'supervisor', 'tecnico'] },
  { href: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['admin'] },
]

interface AppSidebarProps {
  user: User
  profile: Profile | null
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true
    return profile?.role && item.roles.includes(profile.role)
  })

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
          <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sidebar-foreground font-bold text-sm leading-tight truncate">
              Diário de Obras
            </p>
            <p className="text-sidebar-foreground/50 text-xs truncate">RDO Sistema</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Perfil resumido */}
      {!collapsed && profile && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/80 text-xs font-medium truncate">
            {profile.full_name ?? 'Usuário'}
          </p>
          <p className="text-sidebar-foreground/50 text-xs">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </p>
        </div>
      )}

      {/* Botão colapsar */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground shadow-sm transition-colors"
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
