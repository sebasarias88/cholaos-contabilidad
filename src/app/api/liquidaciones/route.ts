import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { seCobra } from '@/lib/descuentos'
import { esFechaISO } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type { TipoPersonaDescuento } from '@/types'

/** POST { persona_id, desde, hasta, nota? } — marca lo pendiente como descontado del sueldo (empleado) o cobrado (cliente) */
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

  // A la familia no se le cobra ni se le descuenta nada
  const { data: persona } = await auth.ctx.supabase
    .from('personas_descuento')
    .select('tipo')
    .eq('id', personaId)
    .maybeSingle()
  if (!persona) return jsonError('Persona no encontrada', 404)
  if (!seCobra(persona.tipo as TipoPersonaDescuento)) {
    return jsonError('A la familia no se le cobra ni se le descuenta', 400)
  }

  const { data, error } = await auth.ctx.supabase.rpc('liquidar_descuentos', {
    p_persona: personaId,
    p_desde: body.desde,
    p_hasta: body.hasta,
    p_nota: nota || null,
  })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json(data, { status: 201 })
}
