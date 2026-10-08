import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { isUuid } from '@/lib/validators'
import { NextResponse } from 'next/server'
import { normalizarVariante } from '@/lib/variantes'

/** PUT /api/variantes/[id] — actualizar (admin) */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!isUuid(id)) return jsonError('Variante no encontrada', 404)

  const body = await leerJson(request)
  if (!body) return jsonError('Body inválido', 400)

  const parsed = normalizarVariante(body, true)
  if ('error' in parsed) return jsonError(parsed.error, 400)
  if (Object.keys(parsed.data).length === 0) return jsonError('Sin cambios', 400)

  const { data, error } = await auth.ctx.supabase
    .from('variantes_producto')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return jsonError(error.message, 400)
  if (!data) return jsonError('Variante no encontrada', 404)
  return NextResponse.json(data)
}

/** DELETE /api/variantes/[id] — soft delete (admin) */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!isUuid(id)) return jsonError('Variante no encontrada', 404)

  const { error } = await auth.ctx.supabase
    .from('variantes_producto')
    .update({ activo: false })
    .eq('id', id)

  if (error) return jsonError(error.message, 400)
  return NextResponse.json({ ok: true })
}
