import { createClient } from '@/lib/supabase/server'
import { VENTA_SELECT } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'
import type { NuevaVentaPayload } from '@/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  let query = supabase
    .from('ventas')
    .select(VENTA_SELECT)
    .order('created_at', { ascending: false })

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body: NuevaVentaPayload = await request.json()

  // Calcular total
  const total = body.items.reduce(
    (acc, item) => acc + item.cantidad * item.precio_unitario, 0
  )

  // Crear la venta (cabecera)
  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .insert({ usuario_id: user.id, total, observaciones: body.observaciones })
    .select()
    .single()

  if (errorVenta) return NextResponse.json({ error: errorVenta.message }, { status: 400 })

  // Insertar el detalle
  const detalles = body.items.map(item => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
  }))

  const { error: errorDetalle } = await supabase
    .from('detalle_ventas')
    .insert(detalles)

  if (errorDetalle) return NextResponse.json({ error: errorDetalle.message }, { status: 400 })

  return NextResponse.json(venta, { status: 201 })
}
