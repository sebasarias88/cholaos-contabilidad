import { requireAdminApi, requireAuthApi } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import type { CrearMedioTransferenciaPayload } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const todas = searchParams.get('todas') === '1'

  const auth = todas ? await requireAdminApi() : await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx
  let query = supabase.from('medios_transferencia').select('*').order('orden')
  if (!todas) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx
  const body = (await request.json()) as CrearMedioTransferenciaPayload
  const nombre = body.nombre?.trim()

  if (!nombre) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }

  const { data: ultimo } = await supabase
    .from('medios_transferencia')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = (ultimo?.orden ?? 0) + 1

  const { data, error } = await supabase
    .from('medios_transferencia')
    .insert({ nombre, orden, activo: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
