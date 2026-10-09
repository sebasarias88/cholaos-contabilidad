import { describe, expect, it } from 'vitest'
import { normalizarPayloadCierre } from '@/lib/cierre/api'
import { baseEfectiva, retiroBase } from '@/lib/cierre/base'
import { construirPayload, estadoDesdeDatos, validarCierre } from '@/lib/cierre/estado'
import { construirFilas } from '@/lib/export-reportes'
import { formatCajas, juntarCajas, separarCajas } from '@/lib/cajas'
import type { CierreDia } from '@/types'
import { datosCierre, producto, PRODUCTOS } from './fixtures'

const cierre = (extra: Partial<CierreDia>): CierreDia => ({
  id: 'c1',
  fecha: '2026-10-07',
  usuario_id: 'u1',
  dinero_base_inicio: 150000,
  dinero_final: 0,
  total_transferencias: 0,
  total_gastos: 0,
  total_domicilios: 0,
  total_ventas: 0,
  efectivo_esperado: 0,
  diferencia: 0,
  estado: 'borrador',
  created_at: '',
  updated_at: '',
  ...extra,
})

describe('base de anoche y base nueva', () => {
  it('el cuadre usa la base nueva si se escribió', () => {
    expect(baseEfectiva({ dineroBase: 200000, baseNueva: null })).toBe(200000)
    expect(baseEfectiva({ dineroBase: 200000, baseNueva: 150000 })).toBe(150000)
  })

  it('el retiro es base de anoche − base nueva (0 en cierres antiguos)', () => {
    expect(retiroBase({ base_anterior: 200000, base_nueva: 150000 })).toBe(50000)
    expect(retiroBase({ base_anterior: 200000, base_nueva: 250000 })).toBe(-50000)
    expect(retiroBase({ base_anterior: 200000, base_nueva: null })).toBe(0)
    expect(retiroBase({ base_anterior: null, base_nueva: null })).toBe(0)
  })

  it('cierre nuevo: base de anoche del último cierre y sin base nueva', () => {
    const e = estadoDesdeDatos(datosCierre())
    expect(e.dineroBase).toBe(50000)
    expect(e.baseNueva).toBeNull()
  })

  it('borrador guardado: recupera la base de anoche y la nueva', () => {
    const e = estadoDesdeDatos(
      datosCierre({
        cierre: cierre({ dinero_base_inicio: 120000, base_anterior: 200000, base_nueva: 120000 }),
      })
    )
    expect(e.dineroBase).toBe(200000)
    expect(e.baseNueva).toBe(120000)
  })

  it('cierre antiguo (sin base_anterior): su base de inicio es la de anoche', () => {
    const e = estadoDesdeDatos(datosCierre({ cierre: cierre({ dinero_base_inicio: 249100 }) }))
    expect(e.dineroBase).toBe(249100)
    expect(e.baseNueva).toBeNull()
  })

  it('empleado manda la base nueva pero no la de anoche', () => {
    const e = { ...estadoDesdeDatos(datosCierre()), baseNueva: 30000 }
    const empleado = construirPayload(e, { fecha: '2026-10-07', esAdmin: false, finalizar: false })
    expect(empleado.base_nueva).toBe(30000)
    expect(empleado).not.toHaveProperty('dinero_base_inicio')
    const admin = construirPayload(e, { fecha: '2026-10-07', esAdmin: true, finalizar: false })
    expect(admin.dinero_base_inicio).toBe(50000)
    expect(normalizarPayloadCierre({ fecha: 'x', base_nueva: '45000' }).base_nueva).toBe(45000)
    expect(normalizarPayloadCierre({ fecha: 'x' }).base_nueva).toBeNull()
  })

  it('el reporte registra el retiro de base por día y en total', () => {
    const { dias, totales } = construirFilas({
      nombreNegocio: 'x',
      desde: '2026-10-07',
      hasta: '2026-10-08',
      resumen: [],
      productos: [],
      cierres: [
        cierre({ estado: 'cerrado', base_anterior: 200000, base_nueva: 150000 }),
        cierre({ fecha: '2026-10-08', estado: 'cerrado' }),
      ],
    })
    expect(dias.map((d) => d.retiro)).toEqual([50000, 0])
    expect(totales.retiroBase).toBe(50000)
  })
})

describe('barquillos en cajas y unidades', () => {
  it('convierte entre cajas + unidades y total', () => {
    expect(juntarCajas(2, 23, 24)).toBe(71)
    expect(separarCajas(71, 24)).toEqual({ cajas: 2, unidades: 23 })
    expect(formatCajas(71, 24)).toBe('2 cajas y 23 und')
    expect(formatCajas(24, 24)).toBe('1 caja')
    expect(formatCajas(5, 24)).toBe('5 und')
    expect(formatCajas(5, null)).toBe('5')
  })

  it('el error de conteo se muestra en cajas y unidades', () => {
    const barquillo = producto({
      id: 'p-barq',
      nombre: 'Barquillo',
      tipo: 'insumo',
      unidad: 'unidad',
      unidades_por_caja: 24,
    })
    const e = estadoDesdeDatos(
      datosCierre({
        productos: [...PRODUCTOS.filter((p) => p.tipo !== 'insumo'), barquillo],
        base_conteos: [{ talla_id: null, producto_id: 'p-barq', cantidad_final: 71 }],
      })
    )
    e.insumos[0] = { ...e.insumos[0], cantidad_final: 80 }
    expect(validarCierre(e, [barquillo], false)).toContain(
      'Barquillo: el final (3 cajas y 8 und) es mayor que lo disponible (2 cajas y 23 und)'
    )
  })
})
