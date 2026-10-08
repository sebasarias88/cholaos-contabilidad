import type { Metadata } from 'next'
import { PanelAlmacenamiento } from '@/components/almacenamiento/PanelAlmacenamiento'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Almacenamiento' }

export default async function AlmacenamientoPage() {
  await requireAdmin()

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <PanelAlmacenamiento />
    </div>
  )
}
