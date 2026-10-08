import type { DesgloseVasoProducto, NovedadVasoInput, Producto } from '@/types'

export type ConteoParaVenta = {
  talla_id?: string
  cantidad_inicio: number
  cantidad_nuevos: number | null
  cantidad_final: number | null
  novedades?: NovedadVasoInput[]
  desglose?: DesgloseVasoProducto[]
  talla?: { onzas: number } | null
}

/** Sin final registrado no hay vasos gastados (evita contar solo con inicio) */
export function vasosGastados(row: ConteoParaVenta): number {
  if (row.cantidad_final === null) return 0
  const nuevos = row.cantidad_nuevos ?? 0
  return Math.max(0, row.cantidad_inicio + nuevos - row.cantidad_final)
}

export function totalNovedades(row: { novedades?: NovedadVasoInput[] }): number {
  return (row.novedades ?? []).reduce((s, n) => s + n.cantidad, 0)
}

/** Gastados menos novedades (venta real) */
export function vendidosReales(row: ConteoParaVenta): number {
  return Math.max(0, vasosGastados(row) - totalNovedades(row))
}

export function sumaDesglose(desglose: DesgloseVasoProducto[] | undefined): number {
  return (desglose ?? []).reduce((s, d) => s + (Number(d.cantidad) || 0), 0)
}

/** true si la suma del desglose coincide con los vasos vendidos */
export function desgloseCuadra(row: ConteoParaVenta): boolean {
  const vendidos = vendidosReales(row)
  return sumaDesglose(row.desglose) === vendidos
}

export type ItemVendidoCalculado = {
  producto_id: string
  cantidad: number
  precio_unitario: number
}

/**
 * Ventas desde conteo de vasos:
 * - Si hay desglose → una línea por producto
 * - Si no y hay un solo producto en la talla → todo a ese producto (compat)
 */
export function calcularItemsVendidos(
  conteoVasos: ConteoParaVenta[],
  productos: Producto[]
): ItemVendidoCalculado[] {
  const items: ItemVendidoCalculado[] = []

  for (const conteo of conteoVasos) {
    if (!conteo.talla_id) continue
    const vendidos = vendidosReales(conteo)
    if (vendidos === 0) continue

    const productosTalla = productos.filter((p) => p.activo && p.talla_id === conteo.talla_id)

    const desglose = (conteo.desglose ?? []).filter((d) => d.cantidad > 0)

    if (desglose.length > 0) {
      for (const d of desglose) {
        const producto = productosTalla.find((p) => p.id === d.producto_id)
        if (!producto) continue
        items.push({
          producto_id: producto.id,
          cantidad: d.cantidad,
          precio_unitario: producto.precio ?? 0,
        })
      }
      continue
    }

    if (productosTalla.length === 1) {
      items.push({
        producto_id: productosTalla[0].id,
        cantidad: vendidos,
        precio_unitario: productosTalla[0].precio ?? 0,
      })
    }
  }

  return items
}

/** Errores de desglose que bloquean el cierre */
export function erroresDesgloseVasos(
  conteoVasos: ConteoParaVenta[],
  productos: Producto[],
  etiquetaTalla: (tallaId: string) => string
): string[] {
  const errores: string[] = []

  for (const row of conteoVasos) {
    if (!row.talla_id) continue
    const vendidos = vendidosReales(row)
    const productosTalla = productos.filter((p) => p.activo && p.talla_id === row.talla_id)
    const label = etiquetaTalla(row.talla_id)

    if (vendidos === 0) {
      if (sumaDesglose(row.desglose) > 0) {
        errores.push(`${label}: no hay vasos vendidos, pero el desglose tiene cantidades`)
      }
      continue
    }

    if (productosTalla.length === 0) {
      errores.push(`${label}: no hay productos activos ligados a este vaso`)
      continue
    }

    if (productosTalla.length === 1) {
      // Un solo producto: el sistema puede auto-asignar; no exigir UI
      continue
    }

    const suma = sumaDesglose(row.desglose)
    if (suma !== vendidos) {
      errores.push(
        `${label}: el desglose suma ${suma} y se vendieron ${vendidos} vasos (deben ser iguales)`
      )
    }
  }

  return errores
}
