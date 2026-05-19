'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { formatFechaHoy } from '@/lib/utils'
import { getPageTitle } from '@/lib/navigation'

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
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

        <p className="shrink-0 text-sm capitalize text-text-secondary">
          {fechaHoy}
        </p>
      </div>
    </header>
  )
}
