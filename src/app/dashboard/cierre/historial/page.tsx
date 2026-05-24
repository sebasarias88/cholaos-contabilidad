import type { Metadata } from 'next'
import { HistorialCierres } from '@/components/cierre/HistorialCierres'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Historial de Cierres' }

export default async function HistorialCierresPage() {
  await requireAdmin()

  return (
    <div className="min-w-0">
      <HistorialCierres />
    </div>
  )
}
