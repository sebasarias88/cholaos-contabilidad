import type { CierreDia, ConteoVaso, Venta } from '@/types'

export type EstadoCuadreHistorial = 'perfecto' | 'falta' | 'sobra'

export type ProductoVendidoHistorial = {
  producto_id: string
  nombre: string
  onzas: number
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export function getDiferenciaCierre(cierre: CierreDia) {
  if (typeof cierre.diferencia === 'number') return cierre.diferencia
  const esperado =
    cierre.efectivo_esperado ??
    cierre.dinero_base_inicio +
      cierre.total_ventas -
      cierre.total_transferencias -
      cierre.total_gastos
  return cierre.dinero_final - esperado
}

export function getEstadoCuadre(diferencia: number): EstadoCuadreHistorial {
  if (diferencia === 0) return 'perfecto'
  if (diferencia < 0) return 'falta'
  return 'sobra'
}

export function totalVasosGastadosCierre(conteo: ConteoVaso[] | undefined) {
  return (
    conteo?.reduce(
      (s, c) =>
        s +
        Math.max(0, c.cantidad_inicio + c.cantidad_nuevos - c.cantidad_final),
      0
    ) ?? 0
  )
}

/** Une líneas de varias ventas del mismo día (evita duplicados del seed) */
export function mergeProductosVendidos(
  ventas: Venta[] | null | undefined
): ProductoVendidoHistorial[] {
  if (!ventas?.length) return []

  const map = new Map<string, ProductoVendidoHistorial>()

  for (const venta of ventas) {
    for (const d of venta.detalle ?? []) {
      const key = d.producto_id
      const subtotal = d.subtotal ?? d.cantidad * d.precio_unitario
      const prev = map.get(key)
      if (prev) {
        prev.cantidad += d.cantidad
        prev.subtotal += subtotal
      } else {
        map.set(key, {
          producto_id: key,
          nombre: d.producto?.nombre ?? '—',
          onzas: d.producto?.onzas ?? 0,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const n = a.nombre.localeCompare(b.nombre)
    return n !== 0 ? n : a.onzas - b.onzas
  })
}
