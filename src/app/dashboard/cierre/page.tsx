import type { Metadata } from 'next'
import { format } from 'date-fns'
import { FormCierreDia } from '@/components/cierre/FormCierreDia'
import { requireAuth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Cierre del día' }

export default async function CierrePage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
}) {
  const usuario = await requireAuth()
  const { fecha } = await searchParams
  const hoy = format(new Date(), 'yyyy-MM-dd')
  const fechaCorreccion =
    usuario.rol === 'admin' &&
    typeof fecha === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    fecha !== hoy
      ? fecha
      : null

  return (
    <div className="min-w-0">
      <FormCierreDia rol={usuario.rol} fechaCorreccion={fechaCorreccion} />
    </div>
  )
}
