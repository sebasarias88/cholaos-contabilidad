import { addDays, format, parseISO } from 'date-fns'
import type { ResumenDia, Venta } from '@/types'

export type ProductoVendido = {
  producto_id: string
  nombre: string
  tipo: string
  medida: string
  cantidad: number
  ingresos: number
}

export function fillRango(resumen: ResumenDia[], desde: string, hasta: string) {
  const map = new Map(resumen.map((r) => [r.fecha, r]))
  const out: ResumenDia[] = []
  let cur = parseISO(desde)
  const end = parseISO(hasta)
  while (cur <= end) {
    const fecha = format(cur, 'yyyy-MM-dd')
    out.push(
      map.get(fecha) ?? {
        fecha,
        ingresos: 0,
        total_vasos: 0,
        total_ventas: 0,
      }
    )
    cur = addDays(cur, 1)
  }
  return out
}

function etiquetaTipoProducto(origen: string | undefined, tipo: string | undefined) {
  if (origen === 'variante') return 'Variante'
  if (origen === 'comida' || tipo === 'comida') return 'Comida'
  if (tipo === 'insumo') return 'Insumo'
  return 'Vaso'
}

function medidaProducto(origen: string | undefined, onzas?: number, unidad?: string) {
  if ((origen ?? 'vaso') === 'vaso' && onzas) return `${onzas} oz`
  return unidad ?? ''
}

export function agruparProductos(ventas: Venta[]): ProductoVendido[] {
  const map = new Map<string, ProductoVendido>()
  for (const venta of ventas) {
    for (const d of venta.detalle ?? []) {
      const tipo = etiquetaTipoProducto(d.origen, d.producto?.tipo)
      const key = `${d.origen ?? 'vaso'}:${d.producto_id}:${d.producto?.nombre ?? ''}`
      const prev = map.get(key) ?? {
        producto_id: key,
        nombre: d.producto?.nombre ?? 'Producto',
        tipo,
        medida: medidaProducto(d.origen, d.producto?.onzas, d.producto?.unidad),
        cantidad: 0,
        ingresos: 0,
      }
      map.set(key, {
        ...prev,
        cantidad: prev.cantidad + d.cantidad,
        ingresos: prev.ingresos + Number(d.subtotal ?? d.cantidad * d.precio_unitario),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.ingresos - a.ingresos)
}
