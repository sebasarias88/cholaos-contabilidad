import type { EstadoCierreForm } from '@/lib/cierre/estado'
import { desgloseCuadra } from '@/lib/cierre/ventas-vasos'
import type { Producto } from '@/types'

export type IdPaso = 'vasos' | 'comida' | 'masas' | 'insumos' | 'caja' | 'revisar'
export type EstadoPaso = 'completo' | 'parcial' | 'pendiente' | 'neutral'

export interface Paso {
  id: IdPaso
  titulo: string
  detalle: string
  estado: EstadoPaso
}

/**
 * Pasos del cierre con su avance. Comida, masas e insumos solo aparecen si el
 * negocio tiene productos de ese tipo.
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

  if (opciones.hayComida) {
    const unidades =
      estado.ventasVariantes.reduce((s, v) => s + (v.cantidad || 0), 0) +
      estado.ventasComida.reduce((s, v) => s + (v.cantidad || 0), 0)
    pasos.push({
      id: 'comida',
      titulo: 'Comida',
      detalle: unidades > 0 ? `${unidades} vendidas` : 'Opcional',
      estado: unidades > 0 ? 'completo' : 'neutral',
    })
  }

  if (estado.masas.length > 0) {
    const anotadas = estado.masas.filter(
      (m) => m.cantidad_inicio !== null && m.cantidad_final !== null
    ).length
    const conError = estado.masas.some(
      (m) =>
        m.cantidad_inicio !== null &&
        m.cantidad_final !== null &&
        m.cantidad_final > m.cantidad_inicio
    )
    pasos.push({
      id: 'masas',
      titulo: 'Masas',
      detalle: `${anotadas} de ${estado.masas.length}`,
      estado:
        anotadas === estado.masas.length && !conError
          ? 'completo'
          : anotadas > 0
            ? 'parcial'
            : 'pendiente',
    })
  }

  if (estado.insumos.length > 0) {
    const contados = estado.insumos.filter((i) => i.cantidad_final !== null).length
    pasos.push({
      id: 'insumos',
      titulo: 'Insumos',
      detalle: `${contados} de ${estado.insumos.length}`,
      estado:
        contados === estado.insumos.length ? 'completo' : contados > 0 ? 'parcial' : 'pendiente',
    })
  }

  const movimientos = estado.gastos.length + estado.transferencias.length + estado.domicilios.length
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
  if (e.startsWith('masas de pizza')) return 'masas'
  if (
    e.includes('dinero') ||
    e.includes('gasto') ||
    e.includes('transferencia') ||
    e.includes('movimiento')
  ) {
    return 'caja'
  }
  return 'vasos'
}
