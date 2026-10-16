import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DashboardResumen } from '@/components/dashboard/DashboardResumen'
import { inicioDeRol, requireAuth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Inicio' }

export default async function DashboardPage() {
  const usuario = await requireAuth()
  if (usuario.rol !== 'admin') redirect(inicioDeRol(usuario.rol))

  return <DashboardResumen nombre={usuario.nombre} />
}
