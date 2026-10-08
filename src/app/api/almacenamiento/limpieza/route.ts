import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { TEXTO_CONFIRMACION } from '@/lib/almacenamiento'
import { esFechaISO } from '@/lib/fechas'
import { NextResponse } from 'next/server'

/** GET /api/almacenamiento/limpieza?hasta= — qué se borraría (admin) */
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const hasta = new URL(request.url).searchParams.get('hasta')
  if (!esFechaISO(hasta)) return jsonError('Fecha inválida', 400)

  const { data, error } = await auth.ctx.supabase.rpc('vista_previa_limpieza', { p_hasta: hasta })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json(data)
}

/** POST /api/almacenamiento/limpieza { hasta, confirmacion: 'BORRAR' } — borra datos antiguos */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await leerJson(request)
  if (!body) return jsonError('Body inválido', 400)
  if (body.confirmacion !== TEXTO_CONFIRMACION) {
    return jsonError(`Escribe ${TEXTO_CONFIRMACION} para confirmar`, 400)
  }
  if (!esFechaISO(body.hasta)) return jsonError('Fecha inválida', 400)

  const { data, error } = await auth.ctx.supabase.rpc('limpiar_datos', { p_hasta: body.hasta })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json(data)
}
