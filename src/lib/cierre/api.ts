import type { PostgrestError } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { CierreDia, CierreDiaEmpleado, GuardarCierrePayload } from '@/types'

/** Select común para GET cierres y prellenado */
export const CIERRE_SELECT = `
  *,
  usuario:usuarios(nombre, rol),
  gastos:gastos_dia(*),
  transferencias:transferencias_dia(*, medio:medios_transferencia(nombre)),
  domicilios:domicilios_dia(*),
  descuentos:descuentos_dia(*),
  conteo_vasos:conteo_vasos(
    *,
    talla:tallas_vasos(*),
    producto:productos(*),
    novedades:novedades_vasos(
      *,
      motivo:motivos_novedad(*)
    )
  ),
  ventas_variantes:ventas_variantes(
    *,
    variante:variantes_producto(*, producto:productos(nombre))
  ),
  ventas_comida:ventas_comida(
    *,
    producto:productos(nombre, precio)
  )
`

/** Versión empleado: sin total_ventas */
export function sanitizarCierreParaEmpleado(cierre: CierreDia): CierreDiaEmpleado {
  const efectivo =
    cierre.dinero_base_inicio +
    cierre.total_ventas -
    cierre.total_transferencias -
    cierre.total_gastos -
    Number(cierre.total_domicilios ?? 0) -
    Number(cierre.total_descuentos ?? 0)

  return {
    id: cierre.id,
    fecha: cierre.fecha,
    dinero_base_inicio: cierre.dinero_base_inicio,
    base_anterior: cierre.base_anterior ?? null,
    base_nueva: cierre.base_nueva ?? null,
    dinero_final: cierre.dinero_final,
    total_transferencias: cierre.total_transferencias,
    total_gastos: cierre.total_gastos,
    total_domicilios: Number(cierre.total_domicilios ?? 0),
    total_descuentos: Number(cierre.total_descuentos ?? 0),
    efectivo_final_esperado: efectivo,
    diferencia_caja: cierre.dinero_final - efectivo,
    cuadre_ok: cierre.dinero_final === efectivo,
    estado: cierre.estado,
    observaciones: cierre.observaciones,
    gastos: cierre.gastos,
    transferencias: cierre.transferencias,
    domicilios: cierre.domicilios,
    descuentos: cierre.descuentos,
    conteo_vasos: cierre.conteo_vasos,
    ventas_variantes: cierre.ventas_variantes,
    ventas_comida: cierre.ventas_comida,
  }
}

/** Error de una función Postgres (raise exception) → respuesta HTTP */
export function respuestaErrorRpc(error: PostgrestError) {
  const status = error.code === '42501' ? 403 : 400
  return NextResponse.json({ error: error.message || 'No se pudo guardar el cierre' }, { status })
}

function num(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function arr(valor: unknown): Record<string, unknown>[] {
  return Array.isArray(valor)
    ? valor.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
    : []
}

function str(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/**
 * Deja pasar solo los campos que entiende guardar_cierre.
 * La validación de negocio (precios, inventario, totales) la hace la BD.
 */
export function normalizarPayloadCierre(raw: Record<string, unknown>): GuardarCierrePayload {
  return {
    fecha: str(raw.fecha),
    finalizar: raw.finalizar !== false,
    dinero_base_inicio: num(raw.dinero_base_inicio) ?? undefined,
    base_nueva: num(raw.base_nueva),
    dinero_final: num(raw.dinero_final),
    observaciones: str(raw.observaciones) || undefined,
    gastos: arr(raw.gastos).map((g) => ({
      descripcion: str(g.descripcion),
      monto: num(g.monto) ?? 0,
    })),
    transferencias: arr(raw.transferencias).map((t) => ({
      medio_id: str(t.medio_id),
      monto: num(t.monto) ?? 0,
    })),
    descuentos: arr(raw.descuentos).map((d) => ({
      descripcion: str(d.descripcion),
      monto: num(d.monto) ?? 0,
    })),
    domicilios: arr(raw.domicilios).map((d) => ({
      descripcion: str(d.descripcion) || undefined,
      monto: num(d.monto) ?? 0,
    })),
    vasos: arr(raw.vasos).map((v) => ({
      talla_id: str(v.talla_id),
      cantidad_nuevos: num(v.cantidad_nuevos) ?? 0,
      cantidad_final: num(v.cantidad_final),
      novedades: arr(v.novedades).map((n) => ({
        motivo_id: str(n.motivo_id),
        motivo_custom: str(n.motivo_custom) || undefined,
        cantidad: num(n.cantidad) ?? 0,
      })),
      desglose: arr(v.desglose).map((d) => ({
        producto_id: str(d.producto_id),
        cantidad: num(d.cantidad) ?? 0,
      })),
    })),
    insumos: arr(raw.insumos).map((i) => ({
      producto_id: str(i.producto_id),
      cantidad_nuevos: num(i.cantidad_nuevos) ?? 0,
      cantidad_final: num(i.cantidad_final),
    })),
    bebidas: arr(raw.bebidas).map((b) => ({
      producto_id: str(b.producto_id),
      cantidad_nuevos: num(b.cantidad_nuevos) ?? 0,
      cantidad_final: num(b.cantidad_final),
      novedades: arr(b.novedades).map((n) => ({
        motivo_id: str(n.motivo_id),
        motivo_custom: str(n.motivo_custom) || undefined,
        cantidad: num(n.cantidad) ?? 0,
      })),
    })),
    masas: arr(raw.masas).map((m) => ({
      producto_id: str(m.producto_id),
      cantidad_inicio: num(m.cantidad_inicio),
      cantidad_final: num(m.cantidad_final),
      numero_masas: num(m.numero_masas),
    })),
    ventas_comida: arr(raw.ventas_comida).map((c) => ({
      producto_id: str(c.producto_id),
      cantidad: num(c.cantidad) ?? 0,
    })),
    ventas_variantes: arr(raw.ventas_variantes).map((c) => ({
      variante_id: str(c.variante_id),
      cantidad: num(c.cantidad) ?? 0,
    })),
  }
}
