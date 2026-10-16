import type { Metadata } from 'next'
import { PizzeriaPanel } from '@/components/pizzeria/PizzeriaPanel'
import { requireAuth } from '@/lib/auth'
import { esFechaISO, hoyColombia } from '@/lib/fechas'

export const metadata: Metadata = { title: 'Pizzería' }

export default async function PizzeriaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
}) {
  const usuario = await requireAuth()
  const { fecha } = await searchParams
  const hoy = hoyColombia()
  // El admin puede abrir otro día (corrección); cajera y pizzero siempre hoy
  const dia = usuario.rol === 'admin' && esFechaISO(fecha) && fecha <= hoy ? fecha : hoy

  return <PizzeriaPanel key={dia} fecha={dia} esAdmin={usuario.rol === 'admin'} />
}
