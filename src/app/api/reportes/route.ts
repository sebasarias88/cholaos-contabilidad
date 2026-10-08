import { jsonError, requireAdminApi } from '@/lib/api-auth'
import { esFechaISO } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type { ResumenDia } from '@/types'

/** GET /api/reportes?desde=&hasta= — resumen diario (solo admin) */
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  if (!esFechaISO(desde) || !esFechaISO(hasta)) {
    return jsonError('desde y hasta son requeridos (YYYY-MM-DD)', 400)
  }
  if (desde > hasta) return jsonError('El rango de fechas es inválido', 400)

  const { data: ventas, error } = await auth.ctx.supabase
    .from('ventas')
    .select('fecha, total, detalle:detalle_ventas(cantidad)')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')

  if (error) return jsonError(error.message, 500)

  const agrupado = new Map<string, ResumenDia>()
  for (const venta of ventas ?? []) {
    const f = venta.fecha as string
    const prev = agrupado.get(f) ?? { fecha: f, ingresos: 0, total_ventas: 0, total_vasos: 0 }
    const vasos = ((venta.detalle as { cantidad: number }[] | null) ?? []).reduce(
      (s, d) => s + Number(d.cantidad),
      0
    )
    agrupado.set(f, {
      fecha: f,
      total_ventas: prev.total_ventas + 1,
      total_vasos: prev.total_vasos + vasos,
      ingresos: prev.ingresos + Number(venta.total),
    })
  }

  return NextResponse.json([...agrupado.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)))
}
