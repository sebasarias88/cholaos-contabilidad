import type { Metadata } from 'next'
import { GestionProductos } from '@/components/productos/GestionProductos'
import { requireDueno } from '@/lib/auth'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductosPage() {
  await requireDueno()

  return (
    <div className="p-6">
      <GestionProductos />
    </div>
  )
}
