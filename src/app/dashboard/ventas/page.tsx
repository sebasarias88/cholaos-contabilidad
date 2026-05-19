import { FormVenta } from '@/components/ventas/FormVenta'
import { requireAuth } from '@/lib/auth'

export default async function VentasPage() {
  await requireAuth()

  return (
    <div className="p-6">
      <FormVenta />
    </div>
  )
}
