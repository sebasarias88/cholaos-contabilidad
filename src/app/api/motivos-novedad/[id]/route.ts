import { requireAdminApi } from '@/lib/api-auth'
import { esMotivoPredefinido } from '@/lib/motivos-novedad'
import { NextResponse } from 'next/server'
import type { ActualizarMotivoNovedadPayload } from '@/types'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx
  const body = (await request.json()) as ActualizarMotivoNovedadPayload

  const { data: existente, error: fetchError } = await supabase
    .from('motivos_novedad')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existente) {
    return NextResponse.json({ error: 'Motivo no encontrado' }, { status: 404 })
  }

  const predefinido = esMotivoPredefinido(existente)
  const update: Record<string, unknown> = {}

  if (body.emoji !== undefined) {
    const emoji = body.emoji.trim()
    if (!emoji) {
      return NextResponse.json({ error: 'El emoji es requerido' }, { status: 400 })
    }
    update.emoji = emoji.slice(0, 8)
  }

  if (body.descripcion !== undefined) {
    if (predefinido) {
      return NextResponse.json(
        { error: 'No se puede cambiar la descripción de un motivo predefinido' },
        { status: 400 }
      )
    }
    const descripcion = body.descripcion.trim()
    if (!descripcion) {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      )
    }
    update.descripcion = descripcion
  }

  if (body.activo !== undefined) {
    if (predefinido && body.activo === false) {
      return NextResponse.json(
        { error: 'Los motivos predefinidos no se pueden desactivar' },
        { status: 400 }
      )
    }
    update.activo = Boolean(body.activo)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('motivos_novedad')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
