import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { NextResponse } from 'next/server'

/** POST { origen, destino } — pasa todos los descuentos de origen a destino y borra origen */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await leerJson<{ origen?: unknown; destino?: unknown }>(request)
  const origen = typeof body?.origen === 'string' ? body.origen : ''
  const destino = typeof body?.destino === 'string' ? body.destino : ''
  if (!origen || !destino || origen === destino) {
    return jsonError('Elige dos personas distintas', 400)
  }

  const { data, error } = await auth.ctx.supabase.rpc('unir_personas_descuento', {
    p_origen: origen,
    p_destino: destino,
  })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json({ movidos: Number(data ?? 0) })
}
