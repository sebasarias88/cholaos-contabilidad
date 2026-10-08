import { requireAuth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await requireAuth()

  return <DashboardShell usuario={usuario}>{children}</DashboardShell>
}
