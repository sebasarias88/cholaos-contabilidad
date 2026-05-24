import type { Metadata } from 'next'
import { FormCierreDia } from '@/components/cierre/FormCierreDia'
import { requireAuth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Cierre del día' }

export default async function CierrePage() {
  const usuario = await requireAuth()

  return (
    <div className="min-w-0">
      <FormCierreDia rol={usuario.rol} />
    </div>
  )
}
