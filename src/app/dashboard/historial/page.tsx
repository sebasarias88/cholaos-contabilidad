import type { Metadata } from 'next'
import { HistorialVentas } from '@/components/ventas/HistorialVentas'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Historial de Ventas' }

export default async function HistorialVentasPage() {
  const usuario = await requireAdmin()

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <HistorialVentas usuarioId={usuario.id} rol={usuario.rol} />
    </div>
  )
}
