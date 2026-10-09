import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { esFechaISO } from '@/lib/fechas'
import { NextResponse } from 'next/server'

/** POST { persona_id, desde, hasta, nota? } — marca como descontado del sueldo lo pendiente */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await leerJson<{
    persona_id?: unknown
    desde?: unknown
    hasta?: unknown
    nota?: unknown
  }>(request)
  const personaId = typeof body?.persona_id === 'string' ? body.persona_id : ''
  if (!personaId) return jsonError('Falta la persona', 400)
  if (!esFechaISO(body?.desde) || !esFechaISO(body?.hasta) || body.desde > body.hasta) {
    return jsonError('El periodo es inválido', 400)
  }
  const nota = typeof body.nota === 'string' ? body.nota.trim().slice(0, 200) : ''

  const { data, error } = await auth.ctx.supabase.rpc('liquidar_descuentos', {
    p_persona: personaId,
    p_desde: body.desde,
    p_hasta: body.hasta,
    p_nota: nota || null,
  })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json(data, { status: 201 })
}
