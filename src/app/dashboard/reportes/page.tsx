import type { Metadata } from 'next'
import { ReportesDashboard } from '@/components/reportes/ReportesDashboard'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  await requireAdmin()

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <ReportesDashboard />
    </div>
  )
}
