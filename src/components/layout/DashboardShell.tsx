'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { Usuario } from '@/types'

interface DashboardShellProps {
  children: React.ReactNode
  usuario: Usuario | null
}

export function DashboardShell({ children, usuario }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar
        usuario={usuario}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          usuario={usuario}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
