import type { CierreDia, CierreDiaEmpleado } from '@/types'

/** Select común para GET cierres y prellenado */
export const CIERRE_SELECT = `
  *,
  usuario:usuarios(nombre, rol),
  gastos:gastos_dia(*),
  transferencias:transferencias_dia(*),
  conteo_vasos:conteo_vasos(
    *,
    talla:tallas_vasos(*),
    novedades:novedades_vasos(
      *,
      motivo:motivos_novedad(*)
    )
  )
`

type CierreRow = CierreDia & {
  total_ventas: number
  efectivo_esperado?: number
  diferencia?: number
}

/** Versión empleado: sin total_ventas ni campos sensibles de Postgres */
export function sanitizarCierreParaEmpleado(cierre: CierreRow): CierreDiaEmpleado {
  const efectivo_calculado =
    cierre.dinero_base_inicio +
    cierre.total_ventas -
    cierre.total_transferencias -
    cierre.total_gastos

  return {
    id: cierre.id,
    fecha: cierre.fecha,
    dinero_base_inicio: cierre.dinero_base_inicio,
    dinero_final: cierre.dinero_final,
    total_transferencias: cierre.total_transferencias,
    total_gastos: cierre.total_gastos,
    efectivo_final_esperado: efectivo_calculado,
    diferencia_caja: cierre.dinero_final - efectivo_calculado,
    cuadre_ok: cierre.dinero_final === efectivo_calculado,
    estado: cierre.estado,
    observaciones: cierre.observaciones,
    gastos: cierre.gastos,
    transferencias: cierre.transferencias,
    conteo_vasos: cierre.conteo_vasos,
  }
}
