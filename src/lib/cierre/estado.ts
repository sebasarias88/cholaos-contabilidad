/**
 * Estado editable del formulario de cierre y sus transformaciones puras
 * (datos del servidor → formulario → payload). Sin React: se prueba con Vitest.
 */
import { tipoProducto } from '@/lib/productos-ui'
import { calcularItemsVendidos, erroresDesgloseVasos } from '@/lib/cierre/ventas-vasos'
import type {
  CierreDia,
  CierreDiaEmpleado,
  ConteoProductoValor,
  ConteoVaso,
  ConteoVasoValor,
  DatosCierre,
  GuardarCierrePayload,
  Producto,
  TallaVaso,
  VentaComidaInput,
  VentaVarianteInput,
} from '@/types'

export type FilaVaso = ConteoVasoValor & { talla_id: string; talla?: TallaVaso }
export type FilaInsumo = ConteoProductoValor & { producto_id: string; producto: Producto }
/** Masa de pizza: se escribe con cuántas empezó y con cuántas terminó (sin precio) */
export type FilaMasa = {
  producto_id: string
  producto: Producto
  cantidad_inicio: number | null
  cantidad_final: number | null
}

/** Masas usadas en el día (empezó − terminó); 0 si falta un dato */
export function masasUsadas(fila: Pick<FilaMasa, 'cantidad_inicio' | 'cantidad_final'>) {
  if (fila.cantidad_inicio === null || fila.cantidad_final === null) return 0
  return Math.max(0, fila.cantidad_inicio - fila.cantidad_final)
}

export type LineaMovimiento = { id: string; descripcion: string; monto: number }
export type LineaTransferencia = LineaMovimiento & { medio_id: string }

export interface EstadoCierreForm {
  vasos: FilaVaso[]
  insumos: FilaInsumo[]
  masas: FilaMasa[]
  ventasVariantes: VentaVarianteInput[]
  ventasComida: VentaComidaInput[]
  gastos: LineaMovimiento[]
  transferencias: LineaTransferencia[]
  domicilios: LineaMovimiento[]
  dineroBase: number
  dineroFinal: number
  observaciones: string
}

export const ESTADO_VACIO: EstadoCierreForm = {
  vasos: [],
  insumos: [],
  masas: [],
  ventasVariantes: [],
  ventasComida: [],
  gastos: [],
  transferencias: [],
  domicilios: [],
  dineroBase: 0,
  dineroFinal: 0,
  observaciones: '',
}

export function idTemporal() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Productos vaso activos agrupados por vaso físico (talla), ordenados */
export function productosPorTalla(productos: Producto[]): Record<string, Producto[]> {
  const mapa: Record<string, Producto[]> = {}
  for (const p of productos) {
    if (!p.talla_id || !p.activo || tipoProducto(p) !== 'vaso') continue
    ;(mapa[p.talla_id] ??= []).push(p)
  }
  for (const lista of Object.values(mapa)) {
    lista.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
  }
  return mapa
}

function tallaDeProducto(producto: Producto, tallaId: string): TallaVaso {
  return (
    producto.talla ?? {
      id: tallaId,
      onzas: producto.onzas ?? 0,
      descripcion: producto.nombre,
      tipo: 'normal',
      activo: true,
      created_at: producto.created_at,
    }
  )
}

/** Filas vacías desde el catálogo activo, con inicio = final del último cierre */
function filasDesdeCatalogo(datos: DatosCierre) {
  const finalAnterior = (tallaId: string | null, productoId: string | null) =>
    datos.base_conteos.find((c) =>
      tallaId ? c.talla_id === tallaId : !c.talla_id && c.producto_id === productoId
    )?.cantidad_final ?? 0

  const vasos: FilaVaso[] = []
  const vistas = new Set<string>()
  const insumos: FilaInsumo[] = []
  const masas: FilaMasa[] = []

  for (const p of datos.productos) {
    const tipo = tipoProducto(p)
    if (tipo === 'vaso' && p.talla_id && !vistas.has(p.talla_id)) {
      vistas.add(p.talla_id)
      vasos.push({
        talla_id: p.talla_id,
        talla: tallaDeProducto(p, p.talla_id),
        cantidad_inicio: finalAnterior(p.talla_id, null),
        cantidad_nuevos: null,
        cantidad_final: null,
        novedades: [],
        desglose: [],
      })
    } else if (tipo === 'insumo') {
      insumos.push({
        producto_id: p.id,
        producto: p,
        cantidad_inicio: finalAnterior(null, p.id),
        cantidad_nuevos: null,
        cantidad_final: null,
      })
    } else if (tipo === 'masa') {
      // Sugerencia: con las que terminó el último cierre (se puede cambiar)
      const anterior = datos.base_conteos.find((c) => !c.talla_id && c.producto_id === p.id)
      masas.push({
        producto_id: p.id,
        producto: p,
        cantidad_inicio: anterior ? anterior.cantidad_final : null,
        cantidad_final: null,
      })
    }
  }
  return { vasos, insumos, masas }
}

function valoresConteo(c: ConteoVaso) {
  return {
    cantidad_nuevos: c.cantidad_nuevos || null,
    cantidad_final: c.cantidad_final,
    novedades: (c.novedades ?? []).map((n) => ({
      motivo_id: n.motivo_id,
      motivo_custom: n.motivo_custom,
      cantidad: n.cantidad,
    })),
    desglose: (c.desglose ?? []).map((d) => ({
      producto_id: d.producto_id,
      cantidad: d.cantidad,
    })),
  }
}

/** Filas de un cierre ya cerrado: se muestran tal como se guardaron */
function filasDesdeCierreCerrado(cierre: CierreDia | CierreDiaEmpleado, productos: Producto[]) {
  const vasos: FilaVaso[] = []
  const insumos: FilaInsumo[] = []
  const masas: FilaMasa[] = []
  for (const c of (cierre.conteo_vasos ?? []) as ConteoVaso[]) {
    const valores = valoresConteo(c)
    if (c.talla_id) {
      vasos.push({
        talla_id: c.talla_id,
        talla: c.talla,
        cantidad_inicio: c.cantidad_inicio,
        ...valores,
        cantidad_nuevos: c.cantidad_nuevos,
      })
      continue
    }
    const producto = c.producto ?? productos.find((p) => p.id === c.producto_id)
    if (!c.producto_id || !producto) continue
    if (tipoProducto(producto) === 'masa') {
      masas.push({
        producto_id: c.producto_id,
        producto,
        cantidad_inicio: c.cantidad_inicio,
        cantidad_final: c.cantidad_final,
      })
      continue
    }
    if (tipoProducto(producto) !== 'insumo') continue
    insumos.push({
      producto_id: c.producto_id,
      producto,
      cantidad_inicio: c.cantidad_inicio,
      cantidad_nuevos: c.cantidad_nuevos,
      cantidad_final: c.cantidad_final,
    })
  }
  return { vasos, insumos, masas }
}

/** Estado inicial del formulario según lo que haya guardado en esa fecha */
export function estadoDesdeDatos(datos: DatosCierre): EstadoCierreForm {
  const { cierre } = datos

  let filas = filasDesdeCatalogo(datos)
  if (cierre?.estado === 'cerrado') {
    filas = filasDesdeCierreCerrado(cierre, datos.productos)
  } else if (cierre) {
    // Borrador: catálogo actual + valores guardados
    const guardados = (cierre.conteo_vasos ?? []) as ConteoVaso[]
    filas = {
      vasos: filas.vasos.map((f) => {
        const g = guardados.find((c) => c.talla_id === f.talla_id)
        return g ? { ...f, ...valoresConteo(g) } : f
      }),
      insumos: filas.insumos.map((f) => {
        const g = guardados.find((c) => !c.talla_id && c.producto_id === f.producto_id)
        return g
          ? { ...f, cantidad_nuevos: g.cantidad_nuevos || null, cantidad_final: g.cantidad_final }
          : f
      }),
      masas: filas.masas.map((f) => {
        const g = guardados.find((c) => !c.talla_id && c.producto_id === f.producto_id)
        return g
          ? { ...f, cantidad_inicio: g.cantidad_inicio, cantidad_final: g.cantidad_final }
          : f
      }),
    }
  }

  return {
    ...filas,
    ventasVariantes: (cierre?.ventas_variantes ?? []).map((v) => ({
      variante_id: v.variante_id,
      cantidad: v.cantidad,
    })),
    ventasComida: (cierre?.ventas_comida ?? []).map((v) => ({
      producto_id: v.producto_id,
      cantidad: v.cantidad,
    })),
    gastos: (cierre?.gastos ?? []).map((g) => ({
      id: g.id,
      descripcion: g.descripcion,
      monto: g.monto,
    })),
    transferencias: (cierre?.transferencias ?? []).map((t) => ({
      id: t.id,
      medio_id: t.medio_id ?? '',
      descripcion: t.medio?.nombre ?? t.descripcion,
      monto: t.monto,
    })),
    domicilios: (cierre?.domicilios ?? []).map((d) => ({
      id: d.id,
      descripcion: d.descripcion?.trim() ?? '',
      monto: Number(d.monto),
    })),
    dineroBase: cierre ? cierre.dinero_base_inicio : datos.dinero_base_inicio,
    dineroFinal: cierre?.dinero_final ?? 0,
    observaciones: cierre?.observaciones ?? '',
  }
}

export function construirPayload(
  estado: EstadoCierreForm,
  opciones: { fecha: string; esAdmin: boolean; finalizar: boolean }
): GuardarCierrePayload {
  return {
    fecha: opciones.fecha,
    finalizar: opciones.finalizar,
    ...(opciones.esAdmin ? { dinero_base_inicio: estado.dineroBase } : {}),
    dinero_final: estado.dineroFinal,
    observaciones: estado.observaciones.trim() || undefined,
    gastos: estado.gastos.map(({ descripcion, monto }) => ({ descripcion, monto })),
    transferencias: estado.transferencias.map(({ medio_id, monto }) => ({ medio_id, monto })),
    domicilios: estado.domicilios.map(({ descripcion, monto }) => ({
      descripcion: descripcion.trim() || undefined,
      monto,
    })),
    vasos: estado.vasos.map((f) => ({
      talla_id: f.talla_id,
      cantidad_nuevos: f.cantidad_nuevos ?? 0,
      cantidad_final: f.cantidad_final,
      novedades: f.novedades.filter((n) => n.cantidad > 0),
      desglose: f.desglose
        .filter((d) => d.cantidad > 0)
        .map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
    })),
    insumos: estado.insumos.map((f) => ({
      producto_id: f.producto_id,
      cantidad_nuevos: f.cantidad_nuevos ?? 0,
      cantidad_final: f.cantidad_final,
    })),
    masas: estado.masas.map((f) => ({
      producto_id: f.producto_id,
      cantidad_inicio: f.cantidad_inicio,
      cantidad_final: f.cantidad_final,
    })),
    ventas_variantes: estado.ventasVariantes
      .filter((v) => v.cantidad > 0)
      .map(({ variante_id, cantidad }) => ({ variante_id, cantidad })),
    ventas_comida: estado.ventasComida
      .filter((v) => v.cantidad > 0)
      .map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
  }
}

export function etiquetaVaso(fila: Pick<FilaVaso, 'talla'> | undefined, fallback = 'Vaso') {
  if (fila?.talla?.descripcion) return fila.talla.descripcion
  if (fila?.talla) return `${fila.talla.onzas} oz`
  return fallback
}

function listar(nombres: string[]) {
  const visibles = nombres.slice(0, 4).join(', ')
  return nombres.length > 4 ? `${visibles} y ${nombres.length - 4} más` : visibles
}

/**
 * Errores que impiden guardar. Al guardar avance solo se validan los datos
 * que ya están escritos; al finalizar se exige todo completo.
 */
export function validarCierre(
  estado: EstadoCierreForm,
  productos: Producto[],
  finalizar: boolean
): string[] {
  const errores: string[] = []
  const etiqueta = (tallaId: string) =>
    etiquetaVaso(estado.vasos.find((f) => f.talla_id === tallaId))

  if (finalizar) {
    const sinContar = [
      ...estado.vasos.filter((f) => f.cantidad_final === null).map((f) => etiquetaVaso(f)),
      ...estado.insumos.filter((f) => f.cantidad_final === null).map((f) => f.producto.nombre),
    ]
    if (sinContar.length > 0) errores.push(`Falta el conteo final de: ${listar(sinContar)}`)
  }

  for (const f of estado.vasos) {
    if (f.cantidad_final === null) continue
    const disponible = f.cantidad_inicio + (f.cantidad_nuevos ?? 0)
    if (f.cantidad_final > disponible) {
      errores.push(
        `${etiquetaVaso(f)}: el final (${f.cantidad_final}) es mayor que lo disponible (${disponible})`
      )
    }
    const gastados = disponible - f.cantidad_final
    const novedades = f.novedades.reduce((s, n) => s + n.cantidad, 0)
    if (novedades > gastados) {
      errores.push(
        `${etiquetaVaso(f)}: hay más novedades (${novedades}) que vasos gastados (${gastados})`
      )
    }
  }

  for (const f of estado.insumos) {
    if (f.cantidad_final === null) continue
    const disponible = f.cantidad_inicio + (f.cantidad_nuevos ?? 0)
    if (f.cantidad_final > disponible) {
      errores.push(
        `${f.producto.nombre}: el final (${f.cantidad_final}) es mayor que lo disponible (${disponible})`
      )
    }
  }

  if (finalizar) {
    const sinAnotar = estado.masas
      .filter((f) => f.cantidad_inicio === null || f.cantidad_final === null)
      .map((f) => f.producto.nombre)
    if (sinAnotar.length > 0) {
      errores.push(`Masas de pizza: falta anotar ${listar(sinAnotar)}`)
    }
  }
  for (const f of estado.masas) {
    if (f.cantidad_inicio === null || f.cantidad_final === null) continue
    if (f.cantidad_final > f.cantidad_inicio) {
      errores.push(
        `Masas de pizza — ${f.producto.nombre}: terminó con ${f.cantidad_final} y empezó con ${f.cantidad_inicio}`
      )
    }
  }

  const gastoSinDescripcion = estado.gastos.some((g) => !g.descripcion.trim())
  if (gastoSinDescripcion) errores.push('Hay un gasto sin descripción')
  if (
    [...estado.gastos, ...estado.transferencias, ...estado.domicilios].some((m) => m.monto <= 0)
  ) {
    errores.push('Hay movimientos de caja con monto en 0')
  }
  if (estado.transferencias.some((t) => !t.medio_id)) {
    errores.push('Hay una transferencia sin medio')
  }

  if (finalizar) {
    errores.push(...erroresDesgloseVasos(estado.vasos, productos, etiqueta))
    if (estado.dineroFinal <= 0) {
      errores.push('Ingresa el dinero final contado en caja (Resumen de caja → Caja)')
    }
  }

  return errores
}

/** Ítems vendidos (vasos + variantes + comida) con precio actual del catálogo */
export function itemsVendidos(estado: EstadoCierreForm, productos: Producto[]) {
  const variantes = productos.flatMap((p) => p.variantes ?? [])
  return [
    ...calcularItemsVendidos(estado.vasos, productos),
    ...estado.ventasVariantes
      .filter((v) => v.cantidad > 0)
      .map((v) => ({
        cantidad: v.cantidad,
        precio_unitario: variantes.find((va) => va.id === v.variante_id)?.precio ?? 0,
      })),
    ...estado.ventasComida
      .filter((v) => v.cantidad > 0)
      .map((v) => ({
        cantidad: v.cantidad,
        precio_unitario: productos.find((p) => p.id === v.producto_id)?.precio ?? 0,
      })),
  ]
}
