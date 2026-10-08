import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DashboardResumen } from '@/components/dashboard/DashboardResumen'
import { requireAuth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Inicio' }

export default async function DashboardPage() {
  const usuario = await requireAuth()
  if (usuario.rol === 'empleado') redirect('/dashboard/cierre')

  return <DashboardResumen nombre={usuario.nombre} />
}
