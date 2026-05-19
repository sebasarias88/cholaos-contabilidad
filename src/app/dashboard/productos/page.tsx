import type { Metadata } from 'next'
import { GestionProductos } from '@/components/productos/GestionProductos'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductosPage() {
  await requireAdmin()

  return (
    <div className="p-6">
      <GestionProductos />
    </div>
  )
}
