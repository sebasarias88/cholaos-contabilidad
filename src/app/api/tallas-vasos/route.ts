import { requireAdminApi } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'
import { esTipoVaso } from '@/lib/utils'
import { NextResponse } from 'next/server'
import type { TipoVaso } from '@/types'

/** Lista tallas de vaso (vaso físico). Admin ve todas; otros solo activas. */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const todas = searchParams.get('todas') === '1'

  let query = supabase
    .from('tallas_vasos')
    .select('*')
    .order('onzas', { ascending: true })
    .order('tipo', { ascending: true })

  if (todas) {
    const auth = await requireAdminApi()
    if (!auth.ok) return auth.response
  } else {
    query = query.eq('activo', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** Crea un vaso físico nuevo (sin producto). Solo admin. */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const onzas = Number(body.onzas)
  const tipo = body.tipo as TipoVaso | undefined
  const descripcion =
    typeof body.descripcion === 'string' ? body.descripcion.trim() : ''

  if (!Number.isFinite(onzas) || onzas <= 0) {
    return NextResponse.json({ error: 'Onzas inválidas' }, { status: 400 })
  }
  if (!tipo || !esTipoVaso(tipo)) {
    return NextResponse.json(
      { error: 'Tipo de vaso inválido (normal, ancho, angosto)' },
      { status: 400 }
    )
  }

  const label =
    descripcion ||
    (tipo === 'normal' ? `${onzas} oz` : `${onzas} oz ${tipo}`)

  const { data, error } = await supabase
    .from('tallas_vasos')
    .insert({
      onzas,
      tipo,
      descripcion: label,
      activo: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
