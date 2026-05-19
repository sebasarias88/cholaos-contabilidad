import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  History,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
} from 'lucide-react'

export type NavLinkConfig = {
  href: string
  label: string
  icon: LucideIcon
  duenoOnly?: boolean
  /** Solo coincide con la ruta exacta (evita conflicto ventas / historial) */
  exact?: boolean
}

export const NAV_LINKS: NavLinkConfig[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  {
    href: '/dashboard/ventas',
    label: 'Registrar Venta',
    icon: ShoppingCart,
    exact: true,
  },
  { href: '/dashboard/ventas/historial', label: 'Historial', icon: History },
  {
    href: '/dashboard/productos',
    label: 'Productos',
    icon: Package,
    duenoOnly: true,
  },
  {
    href: '/dashboard/reportes',
    label: 'Reportes',
    icon: BarChart3,
    duenoOnly: true,
  },
  {
    href: '/dashboard/configuracion',
    label: 'Configuración',
    icon: Settings,
    duenoOnly: true,
  },
]

export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/ventas': 'Registrar Venta',
  '/dashboard/ventas/historial': 'Historial',
  '/dashboard/productos': 'Productos',
  '/dashboard/reportes': 'Reportes',
  '/dashboard/configuracion': 'Configuración',
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
