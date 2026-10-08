import {
  CIERRE_SELECT,
  normalizarPayloadCierre,
  respuestaErrorRpc,
  sanitizarCierreParaEmpleado,
} from '@/lib/cierres-api'
import { jsonError, leerJson, requireAuthApi } from '@/lib/api-auth'
import { esFechaISO, hoyColombia } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type { CierreDia, GuardarCierreResponse } from '@/types'

// GET — admin: ?fecha= o ?desde=&hasta= | empleado: solo ?fecha=hoy
export async function GET(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase, esAdmin } = auth.ctx

  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  for (const f of [fecha, desde, hasta]) {
    if (f !== null && !esFechaISO(f)) return jsonError('Fecha inválida', 400)
  }

  if (!esAdmin) {
    if (desde || hasta) return jsonError('Solo el admin puede listar cierres', 403)
    if (fecha !== hoyColombia()) return jsonError('Solo puedes ver el cierre de hoy', 403)
  } else if (!fecha && (!desde || !hasta)) {
    return jsonError('Indica fecha=YYYY-MM-DD o desde y hasta', 400)
  }

  let query = supabase
    .from('cierres_dia')
    .select(CIERRE_SELECT)
    .order('fecha', { ascending: false })

  if (fecha) query = query.eq('fecha', fecha)
  else query = query.gte('fecha', desde!).lte('fecha', hasta!)

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)

  const filas = (data ?? []) as CierreDia[]

  if (!esAdmin) {
    const uno = filas[0]
    if (!uno) return jsonError('No hay cierre para esa fecha', 404)
    return NextResponse.json(sanitizarCierreParaEmpleado(uno))
  }

  return NextResponse.json(fecha ? (filas[0] ?? null) : filas)
}

// POST — guarda el cierre completo en una sola transacción (función guardar_cierre)
export async function POST(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase, esAdmin } = auth.ctx

  const raw = await leerJson(request)
  if (!raw) return jsonError('Body inválido', 400)

  const payload = normalizarPayloadCierre(raw)
  if (!esFechaISO(payload.fecha)) return jsonError('La fecha es requerida', 400)
  if (!esAdmin) delete payload.dinero_base_inicio

  const { data, error } = await supabase.rpc('guardar_cierre', { p: payload })
  if (error) {
    console.error('[POST /api/cierres] guardar_cierre:', error.message)
    return respuestaErrorRpc(error)
  }

  const r = data as GuardarCierreResponse & { creado: boolean }
  const body: GuardarCierreResponse = esAdmin
    ? { ...r, ok: true, estado: 'cerrado' }
    : {
        ok: true,
        estado: 'cerrado',
        cierre_id: r.cierre_id,
        fecha: r.fecha,
        total_gastos: r.total_gastos,
        total_transferencias: r.total_transferencias,
        total_domicilios: r.total_domicilios,
        dinero_base_inicio: r.dinero_base_inicio,
        dinero_final: r.dinero_final,
        efectivo_esperado: r.efectivo_esperado,
        diferencia: r.diferencia,
      }

  return NextResponse.json(body, { status: r.creado ? 201 : 200 })
}
