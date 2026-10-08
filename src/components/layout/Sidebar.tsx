'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Snowflake, X } from 'lucide-react'
import { filterNavLinksForRol, NAV_LINKS } from '@/lib/navigation'
import { getIniciales } from '@/lib/utils'
import { toastSuccess } from '@/lib/toast'
import { SidebarNavItem } from '@/components/layout/SidebarNavItem'
import type { Usuario } from '@/types'

interface SidebarProps {
  usuario: Usuario | null
  open: boolean
  onClose: () => void
}

function SidebarPanel({
  usuario,
  pathname,
  links,
  onNavigate,
  onLogout,
  showClose,
  onClose,
}: {
  usuario: Usuario | null
  pathname: string
  links: typeof NAV_LINKS
  onNavigate: () => void
  onLogout: () => void
  showClose?: boolean
  onClose?: () => void
}) {
  return (
    <aside className="border-bg-border bg-bg-surface flex h-full w-full flex-col border-r">
      <div className="border-bg-border flex items-center gap-3 border-b px-5 py-5">
        <div className="bg-accent-cyan-dim shadow-glow-cyan flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]">
          <Snowflake size={22} className="text-accent-cyan" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-display text-text-primary text-lg font-bold tracking-tight">
            Cholaos
          </span>
          <p className="text-text-muted text-[11px]">Contabilidad</p>
        </div>
        {showClose && onClose && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="focus-ring-cyan text-text-secondary hover:bg-bg-elevated rounded-[var(--radius-sm)] p-1.5"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {links.map((link) => (
          <SidebarNavItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-bg-border border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="bg-bg-elevated text-accent-cyan flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            aria-hidden
          >
            {usuario ? getIniciales(usuario.nombre) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-text-primary truncate text-sm font-medium">
              {usuario?.nombre ?? 'Usuario'}
            </p>
            <p className="text-text-secondary text-xs capitalize">{usuario?.rol ?? '—'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="focus-ring-cyan border-bg-border text-text-secondary transition-surface hover:bg-bg-elevated hover:text-text-primary flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm"
        >
          <LogOut size={16} aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export function Sidebar({ usuario, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const links = filterNavLinksForRol(NAV_LINKS, usuario?.rol)

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    toastSuccess('Sesión cerrada')
    onClose()
    router.push('/login')
    router.refresh()
  }

  const panelProps = {
    usuario,
    pathname,
    links,
    onNavigate: onClose,
    onLogout: handleLogout,
  }

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-60 md:block">
        <SidebarPanel {...panelProps} />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="bg-bg-base/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <SidebarPanel {...panelProps} showClose onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
