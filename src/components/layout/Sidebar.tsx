'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, X } from 'lucide-react'
import { filterNavLinksForRol, isNavActive, NAV_LINKS, type NavLinkConfig } from '@/lib/navigation'
import { getIniciales } from '@/lib/utils'
import { toastSuccess } from '@/lib/toast'
import type { Usuario } from '@/types'

interface SidebarProps {
  usuario: Usuario | null
  /** Solo íconos (modo enfoque del cierre) */
  compacto: boolean
  abiertoMovil: boolean
  onCerrarMovil: () => void
}

function Logo({ compacto }: { compacto: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compacto ? 'justify-center' : 'px-2'}`}>
      <div className="bg-bg-base flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]">
        <Image src="/icons/icon-192.png" alt="Cholao Oscar" width={44} height={44} priority />
      </div>
      {!compacto && (
        <div className="min-w-0">
          <p className="font-display text-cocoa-text text-lg leading-tight font-extrabold">
            Cholao Oscar
          </p>
          <p className="text-cocoa-muted text-xs font-medium">Armenia · Contabilidad</p>
        </div>
      )}
    </div>
  )
}

function ItemNav({
  link,
  activo,
  compacto,
  onNavegar,
}: {
  link: NavLinkConfig
  activo: boolean
  compacto: boolean
  onNavegar: () => void
}) {
  const Icono = link.icon
  return (
    <Link
      href={link.href}
      onClick={onNavegar}
      aria-current={activo ? 'page' : undefined}
      aria-label={compacto ? link.label : undefined}
      title={compacto ? link.label : undefined}
      className={[
        'focus-ring relative flex min-h-11 items-center gap-3 rounded-[12px] text-[15px] transition-colors',
        compacto ? 'justify-center px-0' : 'px-3',
        activo
          ? 'font-bold text-white'
          : 'text-cocoa-text/85 hover:text-cocoa-text font-semibold hover:bg-white/5',
      ].join(' ')}
    >
      {activo && (
        <motion.span
          layoutId="nav-activo"
          className="bg-brand shadow-brand absolute inset-0 rounded-[12px]"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <Icono size={20} className="relative z-10 shrink-0" aria-hidden />
      {!compacto && <span className="relative z-10 truncate">{link.label}</span>}
    </Link>
  )
}

function Panel({
  usuario,
  compacto,
  onNavegar,
  onCerrar,
}: {
  usuario: Usuario | null
  compacto: boolean
  onNavegar: () => void
  onCerrar?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const links = filterNavLinksForRol(NAV_LINKS, usuario?.rol)

  async function cerrarSesion() {
    await fetch('/api/auth', { method: 'DELETE' })
    toastSuccess('Sesión cerrada')
    onNavegar()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="bg-cocoa text-cocoa-text flex h-full w-full flex-col gap-6 px-3 py-5">
      <div className="flex items-center justify-between">
        <Logo compacto={compacto} />
        {onCerrar && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onCerrar}
            className="focus-ring text-cocoa-muted flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav
        aria-label="Principal"
        className="scroll-thin flex flex-1 flex-col gap-1 overflow-y-auto"
      >
        {links.map((link) => (
          <ItemNav
            key={link.href}
            link={link}
            activo={isNavActive(pathname, link)}
            compacto={compacto}
            onNavegar={onNavegar}
          />
        ))}
      </nav>

      <div
        className={`bg-cocoa-2 flex items-center gap-3 rounded-[16px] p-2.5 ${compacto ? 'flex-col' : ''}`}
      >
        <div
          className="bg-ok-solid flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          aria-hidden
        >
          {usuario ? getIniciales(usuario.nombre) : '?'}
        </div>
        {!compacto && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{usuario?.nombre ?? 'Usuario'}</p>
            <p className="text-cocoa-muted text-xs capitalize">
              {usuario?.rol === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="focus-ring text-cocoa-muted hover:text-cocoa-text flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}

export function Sidebar({ usuario, compacto, abiertoMovil, onCerrarMovil }: SidebarProps) {
  return (
    <>
      <motion.div
        className="fixed inset-y-0 left-0 z-40 hidden h-dvh md:block"
        animate={{ width: compacto ? 84 : 256 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <Panel usuario={usuario} compacto={compacto} onNavegar={() => {}} />
      </motion.div>

      <AnimatePresence>
        {abiertoMovil && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="bg-cocoa/50 fixed inset-0 z-40 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCerrarMovil}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[300px] md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <Panel
                usuario={usuario}
                compacto={false}
                onNavegar={onCerrarMovil}
                onCerrar={onCerrarMovil}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
