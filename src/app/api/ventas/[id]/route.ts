import { createClient } from '@/lib/supabase/server'
import { VENTA_SELECT } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'
import type { VentaUpdateInput } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ventas')
    .select(VENTA_SELECT)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = (await request.json()) as VentaUpdateInput

  const updates: VentaUpdateInput = {}
  if (body.observaciones !== undefined) updates.observaciones = body.observaciones
  if (body.total !== undefined) updates.total = body.total

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ventas')
    .update(updates)
    .eq('id', id)
    .select(VENTA_SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('ventas').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
