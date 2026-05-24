import { requireAdminApi } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CrearMotivoNovedadPayload } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const todas = searchParams.get('todas') === '1'

  if (todas) {
    const auth = await requireAdminApi()
    if (!auth.ok) return auth.response
  }

  const supabase = await createClient()
  let query = supabase.from('motivos_novedad').select('*').order('orden')
  if (!todas) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx
  const body = (await request.json()) as CrearMotivoNovedadPayload
  const descripcion = body.descripcion?.trim()
  const emoji = body.emoji?.trim().slice(0, 8) || '⚪'

  if (!descripcion) {
    return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 })
  }

  const { data: ultimo } = await supabase
    .from('motivos_novedad')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = (ultimo?.orden ?? 0) + 1

  const { data, error } = await supabase
    .from('motivos_novedad')
    .insert({
      descripcion,
      emoji,
      orden,
      activo: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
