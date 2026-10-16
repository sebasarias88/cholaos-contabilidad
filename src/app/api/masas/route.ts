import { jsonError, leerJson, requireAuthApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { esFechaISO, hoyColombia } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type { DatosPizzeria, MasasDia, MotivoNovedad, Producto } from '@/types'

const SELECT_REGISTRO = `
  *,
  usuario:usuarios(nombre),
  conteos:conteo_masas(
    *,
    producto:productos(id, nombre, lleva_masas, orden),
    novedades:novedades_masas(*, motivo:motivos_novedad(id, descripcion, emoji))
  )
`

/**
 * GET /api/masas?fecha=YYYY-MM-DD — datos para anotar la pizzería ese día.
 * GET /api/masas?desde=&hasta= — registros de un rango (historial y reportes).
 * Lo pueden ver admin, cajera y pizzero (no tiene plata).
 */
export async function GET(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  if (desde !== null || hasta !== null) {
    if (!esFechaISO(desde) || !esFechaISO(hasta) || desde > hasta) {
      return jsonError('El rango de fechas es inválido', 400)
    }
    const { data, error } = await supabase
      .from('masas_dia')
      .select(SELECT_REGISTRO)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
      .limit(400)
    if (error) return jsonError(error.message, 500)
    return NextResponse.json((data ?? []) as MasasDia[])
  }

  const hoy = hoyColombia()
  const dia = fecha ?? hoy
  if (!esFechaISO(dia) || dia > hoy) return jsonError('Fecha inválida', 400)

  const [registroRes, anteriorRes, productosRes, motivosRes] = await Promise.all([
    supabase.from('masas_dia').select(SELECT_REGISTRO).eq('fecha', dia).maybeSingle(),
    supabase
      .from('masas_dia')
      .select('fecha, conteos:conteo_masas(producto_id, cantidad_final)')
      .lt('fecha', dia)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'masa')
      .eq('activo', true)
      .order('orden')
      .order('nombre'),
    supabase
      .from('motivos_novedad')
      .select('*')
      .eq('activo', true)
      .eq('aplica_a', 'masas')
      .order('orden'),
  ])

  const error = registroRes.error ?? anteriorRes.error ?? productosRes.error ?? motivosRes.error
  if (error) return jsonError(error.message, 500)

  const anterior = anteriorRes.data as {
    fecha: string
    conteos: { producto_id: string; cantidad_final: number | null }[] | null
  } | null
  const base: Record<string, number> = {}
  for (const c of anterior?.conteos ?? []) {
    if (c.cantidad_final !== null) base[c.producto_id] = c.cantidad_final
  }

  const datos: DatosPizzeria = {
    fecha: dia,
    hoy,
    productos: (productosRes.data ?? []) as Producto[],
    motivos: (motivosRes.data ?? []) as MotivoNovedad[],
    registro: (registroRes.data as MasasDia | null) ?? null,
    base,
    fecha_anterior: anterior?.fecha ?? null,
  }
  return NextResponse.json(datos)
}

/** POST — guarda el conteo de la pizzería de un día (admin cualquier día; los demás, hoy) */
export async function POST(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const body = await leerJson<{ fecha?: unknown; masas?: unknown }>(request)
  if (!body || !esFechaISO(body.fecha)) return jsonError('Fecha inválida', 400)
  if (!auth.ctx.esAdmin && body.fecha !== hoyColombia()) {
    return jsonError('Solo puedes anotar el día de hoy', 403)
  }

  const num = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  const lista = Array.isArray(body.masas) ? body.masas : []
  const masas = lista
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => ({
      producto_id: String(m.producto_id ?? ''),
      cantidad_inicio: num(m.cantidad_inicio),
      cantidad_final: num(m.cantidad_final),
      numero_masas: num(m.numero_masas),
      novedades: (Array.isArray(m.novedades) ? m.novedades : [])
        .filter((n): n is Record<string, unknown> => !!n && typeof n === 'object')
        .map((n) => ({
          motivo_id: String(n.motivo_id ?? ''),
          motivo_custom:
            typeof n.motivo_custom === 'string' ? n.motivo_custom.slice(0, 120) : undefined,
          cantidad: num(n.cantidad) ?? 0,
        })),
    }))

  const { data, error } = await auth.ctx.supabase.rpc('guardar_masas', {
    p: { fecha: body.fecha, masas },
  })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json(data)
}
