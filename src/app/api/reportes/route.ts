import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ResumenDia } from '@/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  if (!desde || !hasta) {
    return NextResponse.json(
      { error: 'desde y hasta son requeridos (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  const { data: ventas, error } = await supabase
    .from('ventas')
    .select(`
      fecha,
      total,
      detalle:detalle_ventas(cantidad)
    `)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const agrupado = (ventas ?? []).reduce<Record<string, ResumenDia>>((acc, venta) => {
    const f = venta.fecha as string
    const prev = acc[f] ?? {
      fecha: f,
      ingresos: 0,
      total_ventas: 0,
      total_vasos: 0,
    }
    const vasos =
      (venta.detalle as { cantidad: number }[] | null)?.reduce(
        (s, d) => s + Number(d.cantidad),
        0
      ) ?? 0
    acc[f] = {
      fecha: f,
      total_ventas: prev.total_ventas + 1,
      total_vasos: prev.total_vasos + vasos,
      ingresos: prev.ingresos + Number(venta.total),
    }
    return acc
  }, {})

  return NextResponse.json(
    Object.values(agrupado).sort((a, b) => a.fecha.localeCompare(b.fecha))
  )
}
