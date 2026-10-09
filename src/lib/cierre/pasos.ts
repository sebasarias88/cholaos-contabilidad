import { masaIncompleta, type EstadoCierreForm } from '@/lib/cierre/estado'
import { desgloseCuadra } from '@/lib/cierre/ventas-vasos'
import type { Producto } from '@/types'

export type IdPaso = 'vasos' | 'comida' | 'masas' | 'caja' | 'revisar'
export type EstadoPaso = 'completo' | 'parcial' | 'pendiente' | 'neutral'

export interface Paso {
  id: IdPaso
  titulo: string
  detalle: string
  estado: EstadoPaso
}

/**
 * Pasos del cierre con su avance: Vasos, Comida (bebidas contadas, ventas de comida y
 * adiciones, insumos), Masas y unidades, Caja y Revisar. Comida y masas solo aparecen
 * si el negocio tiene productos de ese tipo.
 */
export function calcularPasos(
  estado: EstadoCierreForm,
  opciones: { hayComida: boolean; porTalla: Record<string, Producto[]>; errores: number }
): Paso[] {
  const pasos: Paso[] = []

  const vasosContados = estado.vasos.filter((v) => v.cantidad_final !== null).length
  const desgloseOk = estado.vasos.every(
    (v) => (opciones.porTalla[v.talla_id]?.length ?? 0) <= 1 || desgloseCuadra(v)
  )
  pasos.push({
    id: 'vasos',
    titulo: 'Vasos',
    detalle:
      estado.vasos.length === 0
        ? 'Sin vasos'
        : `${vasosContados} de ${estado.vasos.length} contados`,
    estado:
      vasosContados === estado.vasos.length && desgloseOk
        ? 'completo'
        : vasosContados > 0
          ? 'parcial'
          : 'pendiente',
  })

  // Comida: bebidas contadas + ventas de comida/adiciones + insumos, en un solo paso
  if (opciones.hayComida || estado.bebidas.length > 0 || estado.insumos.length > 0) {
    const unidades =
      estado.ventasVariantes.reduce((s, v) => s + (v.cantidad || 0), 0) +
      estado.ventasComida.reduce((s, v) => s + (v.cantidad || 0), 0)
    const porContar = [...estado.bebidas, ...estado.insumos]
    const contados = porContar.filter((c) => c.cantidad_final !== null).length
    const conError = porContar.some(
      (c) =>
        c.cantidad_final !== null && c.cantidad_final > c.cantidad_inicio + (c.cantidad_nuevos ?? 0)
    )
    const detalle =
      porContar.length > 0
        ? `${contados} de ${porContar.length} contados`
        : unidades > 0
          ? `${unidades} vendidas`
          : 'Opcional'
    pasos.push({
      id: 'comida',
      titulo: 'Comida',
      detalle,
      estado:
        porContar.length === 0
          ? unidades > 0
            ? 'completo'
            : 'neutral'
          : contados === porContar.length && !conError
            ? 'completo'
            : contados > 0
              ? 'parcial'
              : 'pendiente',
    })
  }

  if (estado.masas.length > 0) {
    const anotadas = estado.masas.filter((m) => !masaIncompleta(m)).length
    const conError = estado.masas.some(
      (m) =>
        m.cantidad_inicio !== null &&
        m.cantidad_final !== null &&
        m.cantidad_final > m.cantidad_inicio
    )
    pasos.push({
      id: 'masas',
      titulo: 'Masas y unidades',
      detalle: `${anotadas} de ${estado.masas.length}`,
      estado:
        anotadas === estado.masas.length && !conError
          ? 'completo'
          : anotadas > 0
            ? 'parcial'
            : 'pendiente',
    })
  }

  const movimientos =
    estado.gastos.length +
    estado.transferencias.length +
    estado.domicilios.length +
    estado.descuentos.length
  pasos.push({
    id: 'caja',
    titulo: 'Caja',
    detalle:
      estado.dineroFinal > 0
        ? 'Dinero contado'
        : movimientos > 0
          ? `${movimientos} movimiento${movimientos === 1 ? '' : 's'}`
          : 'Gastos y efectivo',
    estado: estado.dineroFinal > 0 ? 'completo' : movimientos > 0 ? 'parcial' : 'pendiente',
  })

  pasos.push({
    id: 'revisar',
    titulo: 'Revisar',
    detalle:
      opciones.errores > 0
        ? `${opciones.errores} pendiente${opciones.errores === 1 ? '' : 's'}`
        : 'Listo para cerrar',
    estado: opciones.errores === 0 ? 'completo' : 'pendiente',
  })

  return pasos
}

/** Paso al que lleva un mensaje de error de validación */
export function pasoDeError(error: string): IdPaso {
  const e = error.toLowerCase()
  if (e.startsWith('masas')) return 'masas'
  if (e.startsWith('bebidas') || e.startsWith('insumos')) return 'comida'
  if (
    e.includes('dinero') ||
    e.includes('gasto') ||
    e.includes('transferencia') ||
    e.includes('movimiento') ||
    e.includes('descuento')
  ) {
    return 'caja'
  }
  return 'vasos'
}
