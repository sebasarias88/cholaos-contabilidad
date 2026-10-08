import type { Metadata } from 'next'
import { HistorialVentas } from '@/components/ventas/HistorialVentas'
import { requireAdmin } from '@/lib/auth'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'

export const metadata: Metadata = { title: 'Historial de Ventas' }

export default async function HistorialVentasPage() {
  await requireAdmin()

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo="Historial de ventas"
        descripcion="Todas las ventas registradas, por día y por vendedor."
      />
      <HistorialVentas />
    </div>
  )
}
