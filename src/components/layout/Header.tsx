'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { formatFechaHoy } from '@/lib/utils'
import { getPageTitle } from '@/lib/navigation'
import type { Usuario } from '@/types'

interface HeaderProps {
  usuario: Usuario | null
  title?: string
  onMenuClick?: () => void
}

export function Header({ usuario, title, onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const pageTitle = title ?? getPageTitle(pathname)
  const fechaHoy = formatFechaHoy()

  return (
    <header className="sticky top-0 z-30 border-b border-bg-border bg-bg-base/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 md:py-5">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={onMenuClick}
              className="focus-ring-cyan rounded-[var(--radius-md)] p-2 text-text-secondary transition-surface hover:bg-bg-elevated hover:text-text-primary md:hidden"
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="font-display truncate text-xl font-bold tracking-tight text-text-primary md:text-2xl">
            {pageTitle}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
          <p className="hidden text-sm capitalize text-text-secondary sm:block">
            {fechaHoy}
          </p>
          <div className="flex items-center gap-2">
            <span className="max-w-[120px] truncate text-sm font-medium text-text-primary sm:max-w-[180px]">
              {usuario?.nombre ?? 'Usuario'}
            </span>
            {usuario && (
              <span
                className={
                  usuario.rol === 'dueno'
                    ? 'badge-cyan text-[10px] uppercase'
                    : 'rounded-[var(--radius-sm)] bg-bg-elevated px-2 py-0.5 text-[10px] uppercase text-text-secondary'
                }
              >
                {usuario.rol === 'dueno' ? 'Dueño' : 'Empleado'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
