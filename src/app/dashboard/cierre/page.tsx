import type { Metadata } from 'next'
import { FormCierreDia } from '@/components/cierre/FormCierreDia'
import { requireAuth } from '@/lib/auth'
import { esFechaISO, hoyColombia } from '@/lib/fechas'

export const metadata: Metadata = { title: 'Cierre del día' }

export default async function CierrePage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
}) {
  const usuario = await requireAuth()
  const { fecha } = await searchParams
  const hoy = hoyColombia()
  const fechaCorreccion =
    usuario.rol === 'admin' &&
    esFechaISO(fecha) &&
    fecha < hoy
      ? fecha
      : null

  return (
    <div className="min-w-0">
      <FormCierreDia
        rol={usuario.rol}
        hoy={hoy}
        fechaCorreccion={fechaCorreccion}
      />
    </div>
  )
}
