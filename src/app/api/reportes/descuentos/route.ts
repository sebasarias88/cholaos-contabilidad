import { jsonError, requireAdminApi } from '@/lib/api-auth'
import { esFechaISO } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type { DescuentoReporte, PersonaDescuento, ReporteDescuentos } from '@/types'

type FilaDescuento = {
  id: string
  persona_id: string | null
  descripcion: string | null
  monto: number
  cierre: { fecha: string; estado: string } | null
  liquidacion: DescuentoReporte['liquidacion']
}

const SELECT_DESCUENTO = `
  id, persona_id, descripcion, monto,
  cierre:cierres_dia!inner(fecha, estado),
  liquidacion:liquidaciones_descuento(id, desde, hasta, total, created_at)
`

/**
 * GET /api/reportes/descuentos?desde=&hasta= — descuentos de los días cerrados del periodo,
 * con su persona y si ya se descontaron del sueldo (solo admin).
 */
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  if (!esFechaISO(desde) || !esFechaISO(hasta)) {
    return jsonError('desde y hasta son requeridos (YYYY-MM-DD)', 400)
  }
  if (desde > hasta) return jsonError('El rango de fechas es inválido', 400)

  const [personas, periodo, anteriores] = await Promise.all([
    supabase.from('personas_descuento').select('*').order('nombre'),
    supabase
      .from('descuentos_dia')
      .select(SELECT_DESCUENTO)
      .eq('cierre.estado', 'cerrado')
      .gte('cierre.fecha', desde)
      .lte('cierre.fecha', hasta),
    // Lo que quedó pendiente de antes del periodo (para no olvidarlo al liquidar)
    supabase
      .from('descuentos_dia')
      .select('persona_id, monto, cierre:cierres_dia!inner(fecha, estado)')
      .is('liquidacion_id', null)
      .eq('cierre.estado', 'cerrado')
      .lt('cierre.fecha', desde),
  ])

  const error = personas.error ?? periodo.error ?? anteriores.error
  if (error) return jsonError(error.message, 500)

  const descuentos: DescuentoReporte[] = ((periodo.data ?? []) as unknown as FilaDescuento[])
    .filter((d) => d.cierre)
    .map((d) => ({
      id: d.id,
      fecha: d.cierre!.fecha,
      persona_id: d.persona_id,
      descripcion: d.descripcion ?? '',
      monto: Number(d.monto),
      liquidacion: d.liquidacion ?? null,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const pendienteAnterior: ReporteDescuentos['pendienteAnterior'] = {}
  const filasAnteriores = (anteriores.data ?? []) as unknown as {
    persona_id: string | null
    monto: number
    cierre: { fecha: string } | null
  }[]
  for (const d of filasAnteriores) {
    if (!d.persona_id || !d.cierre) continue
    const prev = pendienteAnterior[d.persona_id]
    pendienteAnterior[d.persona_id] = {
      monto: (prev?.monto ?? 0) + Number(d.monto),
      desde: prev && prev.desde < d.cierre.fecha ? prev.desde : d.cierre.fecha,
    }
  }

  const respuesta: ReporteDescuentos = {
    personas: (personas.data ?? []) as PersonaDescuento[],
    descuentos,
    pendienteAnterior,
  }
  return NextResponse.json(respuesta)
}
