import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { esTipoVaso } from '@/lib/utils'
import type { ActualizarTallaVasoPayload } from '@/types'

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return auth.error

  const body = (await request.json()) as ActualizarTallaVasoPayload
  const update: Record<string, unknown> = {}

  if (body.onzas !== undefined) {
    const onzas = Number(body.onzas)
    if (!Number.isFinite(onzas) || onzas <= 0) {
      return NextResponse.json(
        { error: 'Las onzas deben ser un número mayor a 0' },
        { status: 400 }
      )
    }
    update.onzas = onzas
  }

  if (body.descripcion !== undefined) {
    update.descripcion = body.descripcion?.trim() || null
  }

  if (body.tipo !== undefined) {
    if (!esTipoVaso(body.tipo)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use: normal, ancho o angosto' },
        { status: 400 }
      )
    }
    update.tipo = body.tipo
  }

  if (body.activo !== undefined) {
    update.activo = Boolean(body.activo)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tallas_vasos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
