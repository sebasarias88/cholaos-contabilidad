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

  // El admin puede abrir otra fecha (cierre atrasado o corrección); el empleado siempre hoy
  const fechaCierre = usuario.rol === 'admin' && esFechaISO(fecha) && fecha <= hoy ? fecha : hoy

  return (
    <div className="min-w-0">
      <FormCierreDia key={fechaCierre} rol={usuario.rol} fecha={fechaCierre} />
    </div>
  )
}
