import type { Metadata } from 'next'
import { ReportesDashboard } from '@/components/reportes/ReportesDashboard'
import { requireDueno } from '@/lib/auth'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  await requireDueno()

  return (
    <div className="p-6">
      <ReportesDashboard />
    </div>
  )
}
