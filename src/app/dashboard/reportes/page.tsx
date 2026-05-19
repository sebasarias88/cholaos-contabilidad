import type { Metadata } from 'next'
import { ReportesDashboard } from '@/components/reportes/ReportesDashboard'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  await requireAdmin()

  return (
    <div className="p-6">
      <ReportesDashboard />
    </div>
  )
}
