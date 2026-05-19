import { DashboardResumen } from '@/components/dashboard/DashboardResumen'
import { requireAuth } from '@/lib/auth'

export default async function DashboardPage() {
  const usuario = await requireAuth()

  return <DashboardResumen rol={usuario.rol} />
}
