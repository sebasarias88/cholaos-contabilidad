import { getMiUsuario } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await getMiUsuario()

  return <DashboardShell usuario={usuario}>{children}</DashboardShell>
}
