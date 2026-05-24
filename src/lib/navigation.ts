import type { LucideIcon } from 'lucide-react'
import {
  BarChart2,
  BookOpen,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Package,
  Settings,
} from 'lucide-react'
import type { Rol } from '@/types'

export type NavLinkConfig = {
  href: string
  label: string
  icon: LucideIcon
  roles: Rol[]
  /** Solo coincide con la ruta exacta (evita conflicto cierre / historial) */
  exact?: boolean
}

export const NAV_LINKS: NavLinkConfig[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin'],
    exact: true,
  },
  {
    href: '/dashboard/cierre',
    label: 'Cierre del día',
    icon: ClipboardCheck,
    roles: ['admin', 'empleado'],
    exact: true,
  },
  {
    href: '/dashboard/historial',
    label: 'Historial ventas',
    icon: History,
    roles: ['admin'],
  },
  {
    href: '/dashboard/cierre/historial',
    label: 'Historial cierres',
    icon: BookOpen,
    roles: ['admin'],
    exact: true,
  },
  {
    href: '/dashboard/productos',
    label: 'Productos',
    icon: Package,
    roles: ['admin'],
  },
  {
    href: '/dashboard/reportes',
    label: 'Reportes',
    icon: BarChart2,
    roles: ['admin'],
  },
  {
    href: '/dashboard/configuracion',
    label: 'Configuración',
    icon: Settings,
    roles: ['admin'],
  },
]

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/cierre': 'Cierre del día',
  '/dashboard/historial': 'Historial ventas',
  '/dashboard/cierre/historial': 'Historial cierres',
  '/dashboard/productos': 'Productos',
  '/dashboard/reportes': 'Reportes',
  '/dashboard/configuracion': 'Configuración',
}

export function filterNavLinksForRol(
  links: NavLinkConfig[],
  rol: Rol | undefined
): NavLinkConfig[] {
  if (!rol) return []
  return links.filter((item) => item.roles.includes(rol))
}

export function isNavActive(pathname: string, link: NavLinkConfig) {
  if (link.exact) return pathname === link.href
  if (link.href === '/dashboard') return pathname === '/dashboard'
  return pathname === link.href || pathname.startsWith(`${link.href}/`)
}

export function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path))
  return match?.[1] ?? 'Cholaos'
}
