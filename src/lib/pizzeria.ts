/**
 * Pizzería (masas y unidades): lógica pura del conteo diario, aparte del cierre.
 * Vendidas = empezó − terminó − novedades (consumo del personal, se quemó…).
 */
import { tipoProducto } from '@/lib/productos-ui'
import type {
  DatosPizzeria,
  GuardarMasasPayload,
  MasasDia,
  NovedadVasoInput,
  Producto,
} from '@/types'

export type FilaPizza = {
  producto_id: string
  producto: Producto
  cantidad_inicio: number | null
  cantidad_final: number | null
  /** Solo si el producto lleva_masas (Pizzeta, Mediana, Familiar) */
  numero_masas: number | null
  novedades: NovedadVasoInput[]
}

export function totalNovedadesPizza(fila: Pick<FilaPizza, 'novedades'>) {
  return fila.novedades.reduce((s, n) => s + (n.cantidad > 0 ? n.cantidad : 0), 0)
}

/** Unidades que salieron (empezó − terminó); null si falta un dato */
export function salieronPizza(fila: Pick<FilaPizza, 'cantidad_inicio' | 'cantidad_final'>) {
  if (fila.cantidad_inicio === null || fila.cantidad_final === null) return null
  return Math.max(0, fila.cantidad_inicio - fila.cantidad_final)
}

/** Vendidas = salieron − novedades (nunca negativo); 0 si falta un dato */
export function vendidasPizza(
  fila: Pick<FilaPizza, 'cantidad_inicio' | 'cantidad_final' | 'novedades'>
) {
  const salieron = salieronPizza(fila)
  if (salieron === null) return 0
  return Math.max(0, salieron - totalNovedadesPizza(fila))
}

/** true si a la fila le falta algún dato por anotar */
export function filaPizzaIncompleta(f: FilaPizza) {
  return (
    f.cantidad_inicio === null ||
    f.cantidad_final === null ||
    (Boolean(f.producto.lleva_masas) && f.numero_masas === null)
  )
}

/** Filas del día: lo guardado, o vacías con "empezó" = con cuántas terminó el último día anotado */
export function filasPizzeria(datos: DatosPizzeria): FilaPizza[] {
  const guardados = datos.registro?.conteos ?? []
  const activos = datos.productos.filter((p) => tipoProducto(p) === 'masa' && p.activo)
  // Productos que ya no están activos pero quedaron guardados ese día también se muestran
  const ids = new Set(activos.map((p) => p.id))
  const extra = guardados
    .filter((c) => !ids.has(c.producto_id) && c.producto)
    .map((c) => ({ ...(c.producto as Producto), activo: false }))

  return [...activos, ...extra]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre, 'es'))
    .map((p) => {
      const g = guardados.find((c) => c.producto_id === p.id)
      if (g) {
        return {
          producto_id: p.id,
          producto: p,
          cantidad_inicio: g.cantidad_inicio,
          cantidad_final: g.cantidad_final,
          numero_masas: g.numero_masas,
          novedades: (g.novedades ?? []).map((n) => ({
            motivo_id: n.motivo_id,
            motivo_custom: n.motivo_custom ?? undefined,
            cantidad: n.cantidad,
          })),
        }
      }
      const anterior = datos.base[p.id]
      return {
        producto_id: p.id,
        producto: p,
        cantidad_inicio: anterior ?? null,
        cantidad_final: null,
        numero_masas: null,
        novedades: [],
      }
    })
}

/** Errores que impiden guardar (datos imposibles). Lo vacío sí se puede guardar. */
export function erroresPizzeria(filas: FilaPizza[]): string[] {
  const errores: string[] = []
  for (const f of filas) {
    const nombre = f.producto.nombre
    if (f.cantidad_inicio === null || f.cantidad_final === null) continue
    if (f.cantidad_final > f.cantidad_inicio) {
      errores.push(`${nombre}: terminó con ${f.cantidad_final} y empezó con ${f.cantidad_inicio}`)
      continue
    }
    const salieron = f.cantidad_inicio - f.cantidad_final
    const novedades = totalNovedadesPizza(f)
    if (novedades > salieron) {
      errores.push(
        `${nombre}: hay más novedades (${novedades}) que unidades que salieron (${salieron})`
      )
    }
  }
  return errores
}

export function payloadPizzeria(fecha: string, filas: FilaPizza[]): GuardarMasasPayload {
  return {
    fecha,
    masas: filas.map((f) => ({
      producto_id: f.producto_id,
      cantidad_inicio: f.cantidad_inicio,
      cantidad_final: f.cantidad_final,
      numero_masas: f.producto.lleva_masas ? f.numero_masas : null,
      novedades: f.novedades
        .filter((n) => n.cantidad > 0)
        .map(({ motivo_id, motivo_custom, cantidad }) => ({
          motivo_id,
          ...(motivo_custom?.trim() ? { motivo_custom: motivo_custom.trim() } : {}),
          cantidad,
        })),
    })),
  }
}

export type FilaPizzaReporte = {
  fecha: string
  producto: string
  empezo: number | null
  termino: number | null
  masas: number | null
  novedades: number
  vendidas: number
  detalleNovedades: string
}

/** Filas planas por día y producto (para reportes y exportar) */
export function filasReportePizzeria(
  registros: MasasDia[],
  motivos: { id: string; descripcion: string }[] = []
): FilaPizzaReporte[] {
  const nombreMotivo = (id: string, custom?: string | null) =>
    custom?.trim() || motivos.find((m) => m.id === id)?.descripcion || 'Novedad'
  return registros
    .flatMap((r) =>
      (r.conteos ?? []).map((c) => {
        const novedades = (c.novedades ?? []).map((n) => ({
          motivo_id: n.motivo_id,
          cantidad: n.cantidad,
          texto: n.motivo?.descripcion
            ? n.motivo_custom?.trim() || n.motivo.descripcion
            : nombreMotivo(n.motivo_id, n.motivo_custom),
        }))
        const fila = {
          cantidad_inicio: c.cantidad_inicio,
          cantidad_final: c.cantidad_final,
          novedades,
        }
        return {
          fecha: r.fecha,
          producto: c.producto?.nombre ?? 'Producto',
          orden: c.producto?.orden ?? 0,
          empezo: c.cantidad_inicio,
          termino: c.cantidad_final,
          masas: c.numero_masas,
          novedades: totalNovedadesPizza(fila),
          vendidas: vendidasPizza(fila),
          detalleNovedades: novedades.map((n) => `${n.cantidad} ${n.texto}`).join(', '),
        }
      })
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden)
    .map((f) => ({
      fecha: f.fecha,
      producto: f.producto,
      empezo: f.empezo,
      termino: f.termino,
      masas: f.masas,
      novedades: f.novedades,
      vendidas: f.vendidas,
      detalleNovedades: f.detalleNovedades,
    }))
}
