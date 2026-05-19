import { ReportesDashboard } from '@/components/reportes/ReportesDashboard'
import { requireDueno } from '@/lib/auth'

export default async function ReportesPage() {
  await requireDueno()

  return (
    <div className="p-6">
      <ReportesDashboard />
    </div>
  )
}
