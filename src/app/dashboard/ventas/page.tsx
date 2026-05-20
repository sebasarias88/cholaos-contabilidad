import type { Metadata } from 'next'
import { FormVenta } from '@/components/ventas/FormVenta'
import { requireAuth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Registrar Venta' }

export default async function VentasPage() {
  await requireAuth()

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <FormVenta />
    </div>
  )
}
