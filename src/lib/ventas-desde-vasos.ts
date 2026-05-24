import type { NovedadVasoInput, Producto } from '@/types'

export type ConteoParaVenta = {
  talla_id?: string
  cantidad_inicio: number
  cantidad_nuevos: number | null
  cantidad_final: number | null
  novedades?: NovedadVasoInput[]
  talla?: { onzas: number } | null
}

/** Sin final registrado no hay vasos gastados (evita contar solo con inicio) */
export function vasosGastados(row: ConteoParaVenta): number {
  if (row.cantidad_final === null) return 0
  const nuevos = row.cantidad_nuevos ?? 0
  return Math.max(0, row.cantidad_inicio + nuevos - row.cantidad_final)
}

export function totalNovedades(row: {
  novedades?: NovedadVasoInput[]
}): number {
  return (row.novedades ?? []).reduce((s, n) => s + n.cantidad, 0)
}

/** Gastados menos novedades (venta real) */
export function vendidosReales(row: ConteoParaVenta): number {
  return Math.max(0, vasosGastados(row) - totalNovedades(row))
}

export type ItemVendidoCalculado = {
  producto_id: string
  cantidad: number
  precio_unitario: number
}

/** items_vendidos desde conteo: producto por talla_id, cantidad = vendidos reales */
export function calcularItemsVendidos(
  conteoVasos: ConteoParaVenta[],
  productos: Producto[]
): ItemVendidoCalculado[] {
  return conteoVasos
    .map((conteo) => {
      if (!conteo.talla_id) return null

      const producto = productos.find(
        (p) => p.activo && p.talla_id === conteo.talla_id
      )
      if (!producto) return null

      const cantidad = vendidosReales(conteo)
      if (cantidad === 0) return null

      return {
        producto_id: producto.id,
        cantidad,
        precio_unitario: producto.precio,
      }
    })
    .filter((item): item is ItemVendidoCalculado => item !== null)
}

export function totalVentasDesdeConteoVasos(
  conteoVasos: ConteoParaVenta[],
  productos: Producto[]
): number {
  return calcularItemsVendidos(conteoVasos, productos).reduce(
    (s, i) => s + i.cantidad * i.precio_unitario,
    0
  )
}

/** @deprecated Usar calcularItemsVendidos */
export const itemsVendidosDesdeConteoVasos = calcularItemsVendidos
