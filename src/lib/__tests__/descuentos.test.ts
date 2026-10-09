import { describe, expect, it } from 'vitest'
import { normalizarPayloadCierre, sanitizarCierreParaEmpleado } from '@/lib/cierre/api'
import { calcularCuadre } from '@/lib/cierre/cuadre'
import { construirPayload, estadoDesdeDatos, validarCierre } from '@/lib/cierre/estado'
import { pasoDeError } from '@/lib/cierre/pasos'
import { construirFilas, descuentosDetalle } from '@/lib/export-reportes'
import type { CierreDia } from '@/types'
import { datosCierre, PRODUCTOS } from './fixtures'

const DESCUENTOS_AYER = [
  { descripcion: 'Eliana', monto: 2900 },
  { descripcion: 'Jugo Leo', monto: 8000 },
  { descripcion: 'Coca-Cola Eliana', monto: 4500 },
  { descripcion: 'Camila', monto: 17000 },
  { descripcion: 'Pizza papá', monto: 81000 },
]

const cierre = (extra: Partial<CierreDia>): CierreDia => ({
  id: 'c1',
  fecha: '2026-10-08',
  usuario_id: 'u1',
  dinero_base_inicio: 249100,
  dinero_final: 800000,
  total_transferencias: 0,
  total_gastos: 0,
  total_domicilios: 0,
  total_ventas: 673000,
  efectivo_esperado: 0,
  diferencia: 0,
  estado: 'cerrado',
  created_at: '',
  updated_at: '',
  ...extra,
})

describe('descuentos (fiados, consumos, préstamos)', () => {
  it('se descuentan de lo que debe haber en caja', () => {
    const c = calcularCuadre({
      dineroBaseInicio: 249100,
      dineroFinal: 800000,
      itemsVendidos: [{ cantidad: 1, precio_unitario: 673000 }],
      transferencias: [],
      gastos: [],
      domicilios: [],
      descuentos: DESCUENTOS_AYER,
    })
    expect(c.totalDescuentos).toBe(113400)
    expect(c.efectivoEsperado).toBe(249100 + 673000 - 113400)
  })

  it('se cargan del cierre guardado y se mandan en el payload', () => {
    const e = estadoDesdeDatos(
      datosCierre({
        cierre: cierre({
          estado: 'borrador',
          descuentos: DESCUENTOS_AYER.map((d, i) => ({
            ...d,
            id: `d${i}`,
            cierre_id: 'c1',
            created_at: '',
          })),
        }),
      })
    )
    expect(e.descuentos).toHaveLength(5)
    const p = construirPayload(e, { fecha: '2026-10-08', esAdmin: true, finalizar: false })
    expect(p.descuentos).toEqual(DESCUENTOS_AYER)
  })

  it('cada descuento necesita descripción y monto', () => {
    const e = estadoDesdeDatos(datosCierre())
    e.descuentos = [
      { id: 'a', descripcion: '  ', monto: 5000 },
      { id: 'b', descripcion: 'Camila', monto: 0 },
    ]
    const errores = validarCierre(e, PRODUCTOS, false)
    expect(errores).toContain('Hay un descuento sin descripción (ej. quién o qué)')
    expect(errores).toContain('Hay movimientos de caja con monto en 0')
    expect(pasoDeError('Hay un descuento sin descripción (ej. quién o qué)')).toBe('caja')
  })

  it('la API normaliza los descuentos', () => {
    const p = normalizarPayloadCierre({
      fecha: '2026-10-08',
      descuentos: [{ descripcion: 'Camila', monto: '17000', cierre_id: 'x' }],
    })
    expect(p.descuentos).toEqual([{ descripcion: 'Camila', monto: 17000 }])
  })

  it('el empleado ve el cuadre con los descuentos', () => {
    const emp = sanitizarCierreParaEmpleado(cierre({ total_descuentos: 113400 }))
    expect(emp.efectivo_final_esperado).toBe(249100 + 673000 - 113400)
  })

  it('el reporte los registra por día y en detalle', () => {
    const c = cierre({
      total_descuentos: 113400,
      descuentos: DESCUENTOS_AYER.map((d, i) => ({
        ...d,
        id: `d${i}`,
        cierre_id: 'c1',
        created_at: '',
      })),
    })
    const { dias, totales } = construirFilas({
      nombreNegocio: 'x',
      desde: '2026-10-08',
      hasta: '2026-10-08',
      resumen: [],
      productos: [],
      cierres: [c],
    })
    expect(dias[0].descuentos).toBe(113400)
    expect(dias[0].esperado).toBe(249100 + 673000 - 113400)
    expect(totales.descuentos).toBe(113400)
    expect(descuentosDetalle([c]).map((d) => d.monto)).toEqual([2900, 8000, 4500, 17000, 81000])
  })
})
