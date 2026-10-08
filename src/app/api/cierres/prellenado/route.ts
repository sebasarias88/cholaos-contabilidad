// GET /api/cierres/prellenado — prellena el formulario del cierre de HOY (hora Colombia)
import { CIERRE_SELECT, sanitizarCierreParaEmpleado } from '@/lib/cierres-api'
import { jsonError, requireAuthApi } from '@/lib/api-auth'
import { hoyColombia } from '@/lib/fechas'
import { NextResponse } from 'next/server'
import type {
  CierreDia,
  ConteoProductoPrellenado,
  PrellenadoNuevo,
  Producto,
  TipoProducto,
} from '@/types'

type BaseCierre = {
  fecha_anterior: string | null
  dinero_final: number
  conteos: { talla_id: string | null; producto_id: string | null; cantidad_final: number }[]
}

export async function GET() {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase, esAdmin } = auth.ctx

  const hoy = hoyColombia()

  const { data: cierreHoy, error: errorHoy } = await supabase
    .from('cierres_dia')
    .select(CIERRE_SELECT)
    .eq('fecha', hoy)
    .maybeSingle()
  if (errorHoy) return jsonError(errorHoy.message, 500)

  if (cierreHoy?.estado === 'cerrado') {
    const cierre = cierreHoy as CierreDia
    return NextResponse.json({
      tipo: 'cierre_existente',
      cierre: esAdmin ? cierre : sanitizarCierreParaEmpleado(cierre),
    })
  }

  const [{ data: baseData, error: errorBase }, { data: productosData, error: errorProd }] =
    await Promise.all([
      supabase.rpc('base_cierre', { p_fecha: hoy }),
      supabase
        .from('productos')
        .select('*, talla:tallas_vasos(*)')
        .eq('activo', true)
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true }),
    ])
  if (errorBase) return jsonError(errorBase.message, 500)
  if (errorProd) return jsonError(errorProd.message, 500)

  const base = (baseData ?? { fecha_anterior: null, dinero_final: 0, conteos: [] }) as BaseCierre
  const productos = (productosData ?? []) as Producto[]

  const conteo_productos: ConteoProductoPrellenado[] = productos.map((producto) => {
    const tipo = (producto.tipo ?? 'vaso') as TipoProducto
    const previo =
      tipo === 'vaso' && producto.talla_id
        ? base.conteos.find((c) => c.talla_id === producto.talla_id)
        : base.conteos.find((c) => !c.talla_id && c.producto_id === producto.id)

    return {
      producto_id: producto.id,
      talla_id: producto.talla_id ?? null,
      tipo,
      producto,
      cantidad_inicio: previo?.cantidad_final ?? 0,
      cantidad_nuevos: 0,
      cantidad_final: 0,
      observacion: '',
      novedades: [],
      precio_unitario: producto.precio ?? 0,
    }
  })

  const prellenado: PrellenadoNuevo = {
    tipo: 'nuevo',
    fecha: hoy,
    fecha_anterior: base.fecha_anterior,
    dinero_base_inicio: base.dinero_final ?? 0,
    conteo_productos,
  }

  return NextResponse.json(prellenado)
}
