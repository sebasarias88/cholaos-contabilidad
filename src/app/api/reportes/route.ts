import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde') ?? new Date().toISOString().split('T')[0]
  const hasta = searchParams.get('hasta') ?? desde

  // Resumen agrupado por día
  const { data: porDia, error } = await supabase
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

  // Agrupar por fecha
  const agrupado = porDia.reduce((acc: Record<string, any>, venta) => {
    const f = venta.fecha
    if (!acc[f]) acc[f] = { fecha: f, ingresos: 0, total_ventas: 0, total_vasos: 0 }
    acc[f].ingresos += venta.total
    acc[f].total_ventas += 1
    acc[f].total_vasos += venta.detalle.reduce((s: number, d: any) => s + d.cantidad, 0)
    return acc
  }, {})

  return NextResponse.json(Object.values(agrupado))
}
