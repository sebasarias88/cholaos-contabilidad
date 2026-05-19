import { GestionProductos } from '@/components/productos/GestionProductos'
import { requireDueno } from '@/lib/auth'

export default async function ProductosPage() {
  await requireDueno()

  return (
    <div className="p-6">
      <GestionProductos />
    </div>
  )
}
