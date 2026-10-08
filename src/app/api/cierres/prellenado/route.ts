// GET /api/cierres/prellenado?fecha=YYYY-MM-DD
// Devuelve todo lo que necesita el formulario del cierre en una sola petición.
// Empleado: solo hoy. Admin: cualquier fecha hasta hoy.
import { CIERRE_SELECT, sanitizarCierreParaEmpleado } from '@/lib/cierre/api'
import { jsonError, requireAuthApi } from '@/lib/api-auth'
import { esFechaISO, hoyColombia } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type {
  CierreDia,
  ConteoBase,
  DatosCierre,
  MedioTransferencia,
  MotivoNovedad,
  Producto,
} from '@/types'

type BaseCierre = {
  fecha_anterior: string | null
  dinero_final: number
  conteos: ConteoBase[]
}

export async function GET(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase, esAdmin } = auth.ctx

  const hoy = hoyColombia()
  const fechaParam = new URL(request.url).searchParams.get('fecha')
  const fecha = fechaParam ?? hoy

  if (!esFechaISO(fecha)) return jsonError('Fecha inválida', 400)
  if (fecha > hoy) return jsonError('No se puede abrir un cierre de un día futuro', 400)
  if (!esAdmin && fecha !== hoy) return jsonError('Solo puedes abrir el cierre de hoy', 403)

  const [cierreRes, baseRes, ultimoRes, productosRes, motivosRes, mediosRes] = await Promise.all([
    supabase.from('cierres_dia').select(CIERRE_SELECT).eq('fecha', fecha).maybeSingle(),
    supabase.rpc('base_cierre', { p_fecha: fecha }),
    supabase.rpc('ultimo_cierre_cerrado'),
    supabase
      .from('productos')
      .select('*, talla:tallas_vasos(*), variantes:variantes_producto(*)')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase.from('motivos_novedad').select('*').eq('activo', true).order('orden'),
    supabase.from('medios_transferencia').select('*').eq('activo', true).order('orden'),
  ])

  const error =
    cierreRes.error ??
    baseRes.error ??
    ultimoRes.error ??
    productosRes.error ??
    motivosRes.error ??
    mediosRes.error
  if (error) return jsonError(error.message, 500)

  const base = (baseRes.data ?? {
    fecha_anterior: null,
    dinero_final: 0,
    conteos: [],
  }) as BaseCierre
  const productos = ((productosRes.data ?? []) as Producto[]).map((p) => ({
    ...p,
    variantes: (p.variantes ?? []).filter((v) => v.activo),
  }))
  const cierre = (cierreRes.data ?? null) as CierreDia | null

  const datos: DatosCierre = {
    fecha,
    hoy,
    ultimo_cierre: (ultimoRes.data as string | null) ?? null,
    fecha_anterior: base.fecha_anterior,
    dinero_base_inicio: base.dinero_final ?? 0,
    base_conteos: base.conteos ?? [],
    productos,
    motivos: (motivosRes.data ?? []) as MotivoNovedad[],
    medios: (mediosRes.data ?? []) as MedioTransferencia[],
    cierre: cierre && !esAdmin ? sanitizarCierreParaEmpleado(cierre) : cierre,
  }

  return NextResponse.json(datos)
}
