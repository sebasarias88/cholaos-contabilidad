import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { esTipoPersona } from '@/lib/descuentos'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

/** PUT — editar nombre, tipo o activo (solo admin) */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await leerJson<{ nombre?: unknown; tipo?: unknown; activo?: unknown }>(request)
  if (!body) return jsonError('Datos inválidos', 400)

  const update: Record<string, unknown> = {}
  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim().replace(/\s+/g, ' ') : ''
    if (!nombre) return jsonError('El nombre es requerido', 400)
    if (nombre.length > 60) return jsonError('El nombre es muy largo (máximo 60 letras)', 400)
    update.nombre = nombre
  }
  if (body.tipo !== undefined) {
    if (!esTipoPersona(body.tipo)) return jsonError('Tipo de persona inválido', 400)
    update.tipo = body.tipo
  }
  if (body.activo !== undefined) update.activo = Boolean(body.activo)
  if (Object.keys(update).length === 0) return jsonError('Sin cambios', 400)

  const { data, error } = await auth.ctx.supabase
    .from('personas_descuento')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      return jsonError('Ya existe una persona con ese nombre. Usa "Unir" para juntarlas.', 409)
    }
    return jsonError(error.message, 400)
  }
  if (!data) return jsonError('Persona no encontrada', 404)
  return NextResponse.json(data)
}

/** DELETE — solo si no tiene descuentos (si tiene, se desactiva o se une con otra) */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  const { count, error: countError } = await supabase
    .from('descuentos_dia')
    .select('id', { count: 'exact', head: true })
    .eq('persona_id', id)
  if (countError) return jsonError(countError.message, 400)
  if ((count ?? 0) > 0) {
    return jsonError(
      'No se puede eliminar: tiene descuentos registrados. Desactívala o únela con otra persona.',
      409
    )
  }

  const { error } = await supabase.from('personas_descuento').delete().eq('id', id)
  if (error) return jsonError(error.message, 400)
  return NextResponse.json({ ok: true })
}
