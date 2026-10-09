import type { Metadata } from 'next'
import { ReportesPanel } from '@/components/reportes/ReportesPanel'
import { requireAdmin } from '@/lib/auth'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  await requireAdmin()

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Ventas del período y descuentos por persona. Exporta a Excel o PDF."
      />
      <ReportesPanel />
    </div>
  )
}
