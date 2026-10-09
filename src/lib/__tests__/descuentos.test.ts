import { describe, expect, it } from 'vitest'
import { normalizarPayloadCierre, sanitizarCierreParaEmpleado } from '@/lib/cierre/api'
import { calcularCuadre } from '@/lib/cierre/cuadre'
import { construirPayload, estadoDesdeDatos, validarCierre } from '@/lib/cierre/estado'
import { pasoDeError } from '@/lib/cierre/pasos'
import { construirFilas, descuentosDetalle } from '@/lib/export-reportes'
import type { CierreDia } from '@/types'
import { datosCierre, PRODUCTOS } from './fixtures'

const PERSONAS = {
  eliana: { id: 'pe1', nombre: 'Eliana', tipo: 'empleado' as const },
  leo: { id: 'pe2', nombre: 'Leo', tipo: 'empleado' as const },
  camila: { id: 'pe3', nombre: 'Camila', tipo: 'empleado' as const },
  papa: { id: 'pe4', nombre: 'Papá', tipo: 'familia' as const },
}

const DESCUENTOS_AYER = [
  { persona: PERSONAS.eliana, descripcion: '', monto: 2900 },
  { persona: PERSONAS.leo, descripcion: 'Jugo', monto: 8000 },
  { persona: PERSONAS.eliana, descripcion: 'Coca-Cola', monto: 4500 },
  { persona: PERSONAS.camila, descripcion: '', monto: 17000 },
  { persona: PERSONAS.papa, descripcion: 'Pizza', monto: 81000 },
]

const descuentosGuardados = (liquidado?: number) =>
  DESCUENTOS_AYER.map((d, i) => ({
    ...d,
    id: `d${i}`,
    cierre_id: 'c1',
    persona_id: d.persona.id,
    liquidacion_id: i === liquidado ? 'li1' : null,
    created_at: '',
  }))

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
          descuentos: descuentosGuardados(3),
        }),
      })
    )
    expect(e.descuentos).toHaveLength(5)
    expect(e.descuentos[1]).toMatchObject({
      persona_id: 'pe2',
      persona_nombre: 'Leo',
      descripcion: 'Jugo',
      liquidado: false,
    })
    expect(e.descuentos[3].liquidado).toBe(true)
    const p = construirPayload(e, { fecha: '2026-10-08', esAdmin: true, finalizar: false })
    expect(p.descuentos).toEqual(
      DESCUENTOS_AYER.map((d, i) => ({
        id: `d${i}`,
        persona_id: d.persona.id,
        descripcion: d.descripcion,
        monto: d.monto,
      }))
    )
  })

  it('los descuentos nuevos no mandan id temporal', () => {
    const e = estadoDesdeDatos(datosCierre())
    e.descuentos = [
      {
        id: 'tmp-1',
        persona_id: 'pe1',
        persona_nombre: 'Eliana',
        descripcion: ' Gaseosa ',
        monto: 4500,
        liquidado: false,
      },
    ]
    const p = construirPayload(e, { fecha: '2026-10-09', esAdmin: false, finalizar: false })
    expect(p.descuentos).toEqual([{ persona_id: 'pe1', descripcion: 'Gaseosa', monto: 4500 }])
  })

  it('cada descuento necesita persona y monto (el concepto es opcional)', () => {
    const e = estadoDesdeDatos(datosCierre())
    const base = { persona_nombre: '', descripcion: '', liquidado: false }
    e.descuentos = [
      { ...base, id: 'a', persona_id: '', monto: 5000 },
      { ...base, id: 'b', persona_id: 'pe3', monto: 0 },
      { ...base, id: 'c', persona_id: 'pe3', monto: 3000 },
    ]
    const errores = validarCierre(e, PRODUCTOS, false)
    const sinPersona = 'Hay un descuento sin persona (elige a quién se le descuenta)'
    expect(errores).toContain(sinPersona)
    expect(errores).toContain('Hay movimientos de caja con monto en 0')
    expect(errores.filter((x) => x.includes('descuento'))).toHaveLength(1)
    expect(pasoDeError(sinPersona)).toBe('caja')
  })

  it('la API normaliza los descuentos', () => {
    const p = normalizarPayloadCierre({
      fecha: '2026-10-08',
      descuentos: [
        { persona_id: 'pe3', descripcion: '', monto: '17000', cierre_id: 'x' },
        { id: 'd9', persona_id: 'pe1', descripcion: 'Coca-Cola', monto: 4500 },
      ],
    })
    expect(p.descuentos).toEqual([
      { persona_id: 'pe3', descripcion: '', monto: 17000 },
      { id: 'd9', persona_id: 'pe1', descripcion: 'Coca-Cola', monto: 4500 },
    ])
  })

  it('el empleado ve el cuadre con los descuentos', () => {
    const emp = sanitizarCierreParaEmpleado(cierre({ total_descuentos: 113400 }))
    expect(emp.efectivo_final_esperado).toBe(249100 + 673000 - 113400)
  })

  it('el reporte los registra por día y en detalle', () => {
    const c = cierre({
      total_descuentos: 113400,
      descuentos: descuentosGuardados(3),
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
    const detalle = descuentosDetalle([c])
    expect(detalle.map((d) => d.persona)).toEqual(['Camila', 'Eliana', 'Eliana', 'Leo', 'Papá'])
    expect(detalle.find((d) => d.persona === 'Camila')?.estado).toBe('Descontado')
    expect(detalle.find((d) => d.persona === 'Papá')).toMatchObject({
      descripcion: 'Pizza',
      monto: 81000,
      estado: 'Pendiente',
    })
  })
})
