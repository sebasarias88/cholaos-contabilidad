import type { Metadata } from 'next'
import { PanelAlmacenamiento } from '@/components/almacenamiento/PanelAlmacenamiento'
import { requireAdmin } from '@/lib/auth'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'

export const metadata: Metadata = { title: 'Almacenamiento' }

export default async function AlmacenamientoPage() {
  await requireAdmin()

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo="Almacenamiento"
        descripcion="Cuánto espacio usa la información del negocio y cómo liberarlo."
      />
      <PanelAlmacenamiento />
    </div>
  )
}
