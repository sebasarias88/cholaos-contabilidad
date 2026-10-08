import { jsonError, requireAdminApi } from '@/lib/api-auth'
import { esFechaISO } from '@/lib/fechas'
import { VENTA_SELECT } from '@/lib/supabase/queries'
import { adjuntarLineasCierre } from '@/lib/ventas-lineas'
import { NextResponse } from 'next/server'
import type { Venta } from '@/types'

/**
 * GET /api/ventas?desde=&hasta= — solo admin.
 * Las ventas se generan únicamente al guardar un cierre (no hay registro manual).
 */
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  if ((desde && !esFechaISO(desde)) || (hasta && !esFechaISO(hasta))) {
    return jsonError('Fecha inválida', 400)
  }

  let query = supabase
    .from('ventas')
    .select(VENTA_SELECT)
    .order('fecha', { ascending: false })

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)

  const ventas = await adjuntarLineasCierre(supabase, (data ?? []) as Venta[])
  return NextResponse.json(ventas)
}
