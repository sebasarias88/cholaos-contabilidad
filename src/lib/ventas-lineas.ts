import type { SupabaseClient } from '@supabase/supabase-js'
import type { DetalleVenta, Venta, VentaComidaCierre, VentaVarianteCierre } from '@/types'

type CierreVentasDia = {
  fecha: string
  ventas_variantes: VentaVarianteCierre[] | null
  ventas_comida: VentaComidaCierre[] | null
}

const CIERRE_VENTAS_SELECT = `
  fecha,
  ventas_variantes:ventas_variantes(
    id,
    cierre_id,
    variante_id,
    cantidad,
    variante:variantes_producto(
      id,
      producto_id,
      nombre,
      precio,
      producto:productos(nombre, tipo, unidad)
    )
  ),
  ventas_comida:ventas_comida(
    id,
    cierre_id,
    producto_id,
    cantidad,
    producto:productos(nombre, tipo, precio, unidad)
  )
`

function marcarOrigenVaso(detalle: DetalleVenta[] | undefined): DetalleVenta[] {
  return (detalle ?? []).map((d) => ({
    ...d,
    origen: d.origen ?? 'vaso',
    subtotal: d.subtotal ?? d.cantidad * d.precio_unitario,
  }))
}

/**
 * El cierre guarda vasos en detalle_ventas y comida/variantes en tablas aparte.
 * El historial necesita las tres en un solo detalle.
 */
export async function adjuntarLineasCierre(
  supabase: SupabaseClient,
  ventas: Venta[]
): Promise<Venta[]> {
  if (ventas.length === 0) return ventas

  const fechas = [...new Set(ventas.map((v) => v.fecha).filter(Boolean))]
  if (fechas.length === 0) {
    return ventas.map((v) => ({ ...v, detalle: marcarOrigenVaso(v.detalle) }))
  }

  const { data, error } = await supabase
    .from('cierres_dia')
    .select(CIERRE_VENTAS_SELECT)
    .in('fecha', fechas)

  if (error || !data) {
    return ventas.map((v) => ({ ...v, detalle: marcarOrigenVaso(v.detalle) }))
  }

  const porFecha = new Map<string, CierreVentasDia>()
  for (const row of data as unknown as CierreVentasDia[]) {
    porFecha.set(row.fecha, row)
  }

  // Comida vive en el cierre, no en cada venta. Se adjunta una sola vez por día.
  const ventaDelCierre = new Map<string, string>()
  for (const venta of ventas) {
    const cierreId = (venta as Venta & { cierre_id?: string | null }).cierre_id
    if (cierreId && !ventaDelCierre.has(venta.fecha)) {
      ventaDelCierre.set(venta.fecha, venta.id)
    }
  }
  for (const venta of ventas) {
    if (!ventaDelCierre.has(venta.fecha)) {
      ventaDelCierre.set(venta.fecha, venta.id)
    }
  }

  return ventas.map((venta) => {
    const vasos = marcarOrigenVaso(venta.detalle)
    const cierre = porFecha.get(venta.fecha)
    if (!cierre || ventaDelCierre.get(venta.fecha) !== venta.id) {
      return { ...venta, detalle: vasos }
    }

    const extra: DetalleVenta[] = []

    for (const linea of cierre.ventas_comida ?? []) {
      if (!linea.cantidad) continue
      const precio = Number(linea.producto?.precio) || 0
      extra.push({
        id: `comida-${linea.id}`,
        venta_id: venta.id,
        producto_id: linea.producto_id,
        cantidad: linea.cantidad,
        precio_unitario: precio,
        subtotal: linea.cantidad * precio,
        origen: 'comida',
        producto: {
          nombre: linea.producto?.nombre ?? 'Comida',
          tipo: 'comida',
          unidad: linea.producto?.unidad,
        },
      })
    }

    for (const linea of cierre.ventas_variantes ?? []) {
      if (!linea.cantidad) continue
      const variante = linea.variante
      const precio = Number(variante?.precio) || 0
      const nombreProd = variante?.producto?.nombre
      const nombreVar = variante?.nombre
      const nombre = nombreProd && nombreVar
        ? `${nombreProd} · ${nombreVar}`
        : nombreVar ?? nombreProd ?? 'Variante'
      extra.push({
        id: `variante-${linea.id}`,
        venta_id: venta.id,
        producto_id: variante?.producto_id ?? linea.variante_id,
        cantidad: linea.cantidad,
        precio_unitario: precio,
        subtotal: linea.cantidad * precio,
        origen: 'variante',
        producto: {
          nombre,
          tipo: 'comida',
          unidad: variante?.producto?.unidad,
        },
      })
    }

    return { ...venta, detalle: [...vasos, ...extra] }
  })
}
