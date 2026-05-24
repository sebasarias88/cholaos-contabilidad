import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { esTipoVaso } from '@/lib/utils'
import type { CrearTallaVasoPayload, TallaVaso, TipoVaso } from '@/types'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (miUsuario?.rol !== 'admin') {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }

  return { user }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const todas = searchParams.get('todas') === '1'

  if (todas) {
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error
  }

  let query = supabase.from('tallas_vasos').select('*').order('onzas')
  if (!todas) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return auth.error

  const body = (await request.json()) as CrearTallaVasoPayload
  const onzas = Number(body.onzas)
  if (!Number.isFinite(onzas) || onzas <= 0) {
    return NextResponse.json({ error: 'Las onzas deben ser un número mayor a 0' }, { status: 400 })
  }

  const tipo: TipoVaso = esTipoVaso(body.tipo) ? body.tipo : 'normal'

  const { data, error } = await supabase
    .from('tallas_vasos')
    .insert({
      onzas,
      descripcion: body.descripcion?.trim() || null,
      tipo,
      activo: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data as TallaVaso, { status: 201 })
}
