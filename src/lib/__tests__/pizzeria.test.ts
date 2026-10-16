import { describe, expect, it } from 'vitest'
import { construirPayload, estadoDesdeDatos } from '@/lib/cierre/estado'
import { calcularPasos } from '@/lib/cierre/pasos'
import {
  erroresPizzeria,
  filaPizzaIncompleta,
  filasPizzeria,
  filasReportePizzeria,
  payloadPizzeria,
  vendidasPizza,
} from '@/lib/pizzeria'
import { esSoloConteo, tipoProducto } from '@/lib/productos-ui'
import type { DatosPizzeria, MasasDia } from '@/types'
import { datosCierre, producto, PRODUCTOS } from './fixtures'

const PORCION = producto({
  id: 'm-porcion',
  nombre: 'Porción',
  tipo: 'masa',
  unidad: 'masa',
  orden: 1,
})
const FAMILIAR = producto({
  id: 'm-familiar',
  nombre: 'Unidades Familiar',
  lleva_masas: true,
  tipo: 'masa',
  unidad: 'masa',
  orden: 4,
})

const datos = (extra: Partial<DatosPizzeria> = {}): DatosPizzeria => ({
  fecha: '2026-10-16',
  hoy: '2026-10-16',
  productos: [FAMILIAR, PORCION, ...PRODUCTOS],
  motivos: [
    { id: 'mp1', descripcion: 'Consumo del personal', emoji: '🍕', activo: true, orden: 1 },
  ],
  registro: null,
  base: { 'm-porcion': 2 },
  fecha_anterior: '2026-10-15',
  ...extra,
})

const REGISTRO: MasasDia = {
  id: 'md1',
  fecha: '2026-10-15',
  usuario_id: 'u3',
  created_at: '',
  updated_at: '',
  conteos: [
    {
      id: 'c1',
      masas_dia_id: 'md1',
      producto_id: 'm-familiar',
      cantidad_inicio: 6,
      cantidad_final: 1,
      numero_masas: 4,
      producto: { id: 'm-familiar', nombre: 'Unidades Familiar', lleva_masas: true, orden: 4 },
      novedades: [
        {
          motivo_id: 'mp1',
          cantidad: 1,
          motivo: {
            id: 'mp1',
            descripcion: 'Consumo del personal',
            emoji: '🍕',
            activo: true,
            orden: 1,
          },
        },
      ],
    },
  ],
}

describe('pizzería (masas aparte del cierre)', () => {
  it('es un tipo de producto solo de conteo (sin precio)', () => {
    expect(tipoProducto(PORCION)).toBe('masa')
    expect(esSoloConteo('masa')).toBe(true)
  })

  it('día nuevo: "empezó con" sale de lo que terminó el último día anotado', () => {
    const filas = filasPizzeria(datos())
    expect(filas.map((f) => f.producto.nombre)).toEqual(['Porción', 'Unidades Familiar'])
    expect(filas[0].cantidad_inicio).toBe(2)
    expect(filas[1].cantidad_inicio).toBeNull()
  })

  it('día guardado: muestra lo anotado con sus novedades', () => {
    const filas = filasPizzeria(datos({ registro: { ...REGISTRO, fecha: '2026-10-16' } }))
    const familiar = filas.find((f) => f.producto_id === 'm-familiar')!
    expect(familiar).toMatchObject({ cantidad_inicio: 6, cantidad_final: 1, numero_masas: 4 })
    expect(familiar.novedades).toEqual([
      { motivo_id: 'mp1', motivo_custom: undefined, cantidad: 1 },
    ])
  })

  it('vendidas = empezó − terminó − novedades', () => {
    const [porcion] = filasPizzeria(datos())
    expect(vendidasPizza({ ...porcion, cantidad_final: null })).toBe(0)
    expect(
      vendidasPizza({
        ...porcion,
        cantidad_inicio: 10,
        cantidad_final: 3,
        novedades: [{ motivo_id: 'mp1', cantidad: 2 }],
      })
    ).toBe(5)
  })

  it('no deja terminar con más de las que empezó ni más novedades que las que salieron', () => {
    const [porcion, familiar] = filasPizzeria(datos())
    expect(
      erroresPizzeria([
        { ...porcion, cantidad_inicio: 2, cantidad_final: 5 },
        {
          ...familiar,
          cantidad_inicio: 4,
          cantidad_final: 3,
          novedades: [{ motivo_id: 'mp1', cantidad: 2 }],
        },
      ])
    ).toEqual([
      'Porción: terminó con 5 y empezó con 2',
      'Unidades Familiar: hay más novedades (2) que unidades que salieron (1)',
    ])
    // Lo vacío sí se puede guardar
    expect(erroresPizzeria(filasPizzeria(datos()))).toEqual([])
  })

  it('Familiar exige el número de masas para quedar completa; Porción no', () => {
    const [porcion, familiar] = filasPizzeria(datos())
    expect(filaPizzaIncompleta({ ...porcion, cantidad_inicio: 2, cantidad_final: 1 })).toBe(false)
    expect(filaPizzaIncompleta({ ...familiar, cantidad_inicio: 2, cantidad_final: 1 })).toBe(true)
  })

  it('el payload manda conteo, masas solo donde aplica y novedades con cantidad', () => {
    const [porcion, familiar] = filasPizzeria(datos())
    const p = payloadPizzeria('2026-10-16', [
      { ...porcion, numero_masas: 9, novedades: [{ motivo_id: 'mp1', cantidad: 0 }] },
      {
        ...familiar,
        cantidad_inicio: 5,
        cantidad_final: 2,
        numero_masas: 3,
        novedades: [{ motivo_id: 'mp1', motivo_custom: '  ', cantidad: 1 }],
      },
    ])
    expect(p).toEqual({
      fecha: '2026-10-16',
      masas: [
        {
          producto_id: 'm-porcion',
          cantidad_inicio: 2,
          cantidad_final: null,
          numero_masas: null,
          novedades: [],
        },
        {
          producto_id: 'm-familiar',
          cantidad_inicio: 5,
          cantidad_final: 2,
          numero_masas: 3,
          novedades: [{ motivo_id: 'mp1', cantidad: 1 }],
        },
      ],
    })
  })

  it('el reporte lista cada día con vendidas y el detalle de novedades', () => {
    expect(filasReportePizzeria([REGISTRO])).toEqual([
      {
        fecha: '2026-10-15',
        producto: 'Unidades Familiar',
        empezo: 6,
        termino: 1,
        masas: 4,
        novedades: 1,
        vendidas: 4,
        detalleNovedades: '1 Consumo del personal',
      },
    ])
  })

  it('el cierre ya no tiene paso de masas ni las manda', () => {
    const e = estadoDesdeDatos(datosCierre({ productos: [...PRODUCTOS, PORCION, FAMILIAR] }))
    expect('masas' in e).toBe(false)
    const pasos = calcularPasos(e, { hayComida: true, porTalla: {}, errores: 0 })
    expect(pasos.map((x) => x.id)).not.toContain('masas')
    const payload = construirPayload(e, { fecha: '2026-10-16', esAdmin: true, finalizar: false })
    expect('masas' in payload).toBe(false)
  })
})
