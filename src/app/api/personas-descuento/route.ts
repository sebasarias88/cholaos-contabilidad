import { jsonError, leerJson, requireAdminApi, requireAuthApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { esTipoPersona } from '@/lib/descuentos'
import { NextResponse } from 'next/server'
import type { PersonaDescuento } from '@/types'

/**
 * GET /api/personas-descuento — personas activas (cualquier usuario).
 * ?todas=1 (admin) — también las inactivas, con cuántos descuentos tiene cada una.
 */
export async function GET(request: Request) {
  const todas = new URL(request.url).searchParams.get('todas') === '1'
  const auth = todas ? await requireAdminApi() : await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  if (!todas) {
    const { data, error } = await supabase
      .from('personas_descuento')
      .select('*')
      .eq('activo', true)
      .order('nombre')
    if (error) return jsonError(error.message, 500)
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('personas_descuento')
    .select('*, descuentos:descuentos_dia(count)')
    .order('nombre')
  if (error) return jsonError(error.message, 500)

  const personas = (data ?? []).map((fila) => {
    const { descuentos, ...persona } = fila as PersonaDescuento & {
      descuentos?: { count: number }[]
    }
    return { ...persona, total_descuentos: Number(descuentos?.[0]?.count ?? 0) }
  })
  return NextResponse.json(personas)
}

/** POST — crea una persona (o devuelve la que ya tiene ese nombre). Cualquier usuario. */
export async function POST(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const body = await leerJson<{ nombre?: unknown; tipo?: unknown }>(request)
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : ''
  if (!nombre) return jsonError('Escribe el nombre de la persona', 400)
  const tipo = esTipoPersona(body?.tipo) ? body.tipo : 'empleado'

  const { data, error } = await auth.ctx.supabase.rpc('crear_persona_descuento', {
    p_nombre: nombre,
    p_tipo: tipo,
  })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json(data, { status: 201 })
}
