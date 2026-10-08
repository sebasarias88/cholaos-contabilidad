import { jsonError, leerJson, requireAdminApi, requireAuthApi } from '@/lib/api-auth'
import { isUuid } from '@/lib/validators'
import { normalizarVariante } from '@/lib/variantes'
import { NextResponse } from 'next/server'

/** GET /api/variantes?producto_id=xxx — activas */
export async function GET(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const producto_id = searchParams.get('producto_id')

  let query = auth.ctx.supabase
    .from('variantes_producto')
    .select('*')
    .eq('activo', true)
    .order('orden')

  if (producto_id) {
    if (!isUuid(producto_id)) return jsonError('Producto inválido', 400)
    query = query.eq('producto_id', producto_id)
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

/** POST /api/variantes — crear (admin) */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  const body = await leerJson(request)
  if (!body) return jsonError('Body inválido', 400)
  if (!isUuid(body.producto_id)) return jsonError('Producto inválido', 400)

  const parsed = normalizarVariante(body, false)
  if ('error' in parsed) return jsonError(parsed.error, 400)

  const { data: producto } = await supabase
    .from('productos')
    .select('id, tipo')
    .eq('id', body.producto_id)
    .maybeSingle()
  if (!producto || producto.tipo !== 'comida') {
    return jsonError('Solo los productos de comida tienen variantes', 400)
  }

  const { data, error } = await supabase
    .from('variantes_producto')
    .insert({ ...parsed.data, producto_id: producto.id, activo: true })
    .select()
    .single()

  if (error) return jsonError(error.message, 400)
  return NextResponse.json(data, { status: 201 })
}
