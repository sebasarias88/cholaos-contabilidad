import type { Metadata } from 'next'
import { ConfiguracionPanel } from '@/components/configuracion/ConfiguracionPanel'
import { requireDueno } from '@/lib/auth'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  await requireDueno()

  return (
    <div className="p-6">
      <ConfiguracionPanel />
    </div>
  )
}
