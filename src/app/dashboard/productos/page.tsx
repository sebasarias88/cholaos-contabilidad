import type { Metadata } from 'next'
import { GestionProductos } from '@/components/productos/GestionProductos'
import { requireAdmin } from '@/lib/auth'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductosPage() {
  await requireAdmin()

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo="Productos"
        descripcion="Vasos, comida, bebidas e insumos con sus precios."
      />
      <GestionProductos />
    </div>
  )
}
