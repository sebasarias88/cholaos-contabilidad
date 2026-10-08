'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Usuario } from '@/types'

export function DashboardShell({
  children,
  usuario,
}: {
  children: React.ReactNode
  usuario: Usuario | null
}) {
  const [menuMovil, setMenuMovil] = useState(false)
  const pathname = usePathname()
  // Modo enfoque: durante el cierre el menú se reduce a íconos para ganar espacio
  const compacto = pathname === '/dashboard/cierre'

  return (
    <div className="bg-bg-base min-h-dvh">
      <a
        href="#contenido"
        className="bg-cocoa text-cocoa-text focus-ring sr-only z-[60] rounded-lg px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <Sidebar
        usuario={usuario}
        compacto={compacto}
        abiertoMovil={menuMovil}
        onCerrarMovil={() => setMenuMovil(false)}
      />
      <div
        className={`flex min-h-dvh min-w-0 flex-col transition-[margin] duration-300 ease-out ${
          compacto ? 'md:ml-[84px]' : 'md:ml-[256px]'
        }`}
      >
        <Header onMenuClick={() => setMenuMovil(true)} />
        <main id="contenido" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
