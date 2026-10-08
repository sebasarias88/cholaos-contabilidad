import { requireAdminApi } from '@/lib/api-auth'
import { NextResponse } from 'next/server'
import type { ActualizarMedioTransferenciaPayload } from '@/types'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx
  const body = (await request.json()) as ActualizarMedioTransferenciaPayload

  const { data: existente, error: fetchError } = await supabase
    .from('medios_transferencia')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existente) {
    return NextResponse.json({ error: 'Medio no encontrado' }, { status: 404 })
  }

  const update: Record<string, unknown> = {}

  if (body.nombre !== undefined) {
    const nombre = body.nombre.trim()
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    update.nombre = nombre
  }

  if (body.activo !== undefined) {
    update.activo = Boolean(body.activo)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('medios_transferencia')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx

  const { data: existente, error: fetchError } = await supabase
    .from('medios_transferencia')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !existente) {
    return NextResponse.json({ error: 'Medio no encontrado' }, { status: 404 })
  }

  const { count, error: countError } = await supabase
    .from('transferencias_dia')
    .select('id', { count: 'exact', head: true })
    .eq('medio_id', id)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          'No se puede eliminar: este medio ya aparece en cierres. Desactívalo para ocultarlo.',
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('medios_transferencia').delete().eq('id', id)

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('foreign key') || msg.includes('violates')) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar: el medio está en uso. Desactívalo para ocultarlo.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
