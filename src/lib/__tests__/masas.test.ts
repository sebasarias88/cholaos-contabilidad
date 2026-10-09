import { describe, expect, it } from 'vitest'
import { normalizarPayloadCierre } from '@/lib/cierre/api'
import {
  construirPayload,
  estadoDesdeDatos,
  masasUsadas,
  validarCierre,
  type EstadoCierreForm,
} from '@/lib/cierre/estado'
import { calcularPasos, pasoDeError } from '@/lib/cierre/pasos'
import { masasDetalle } from '@/lib/export-reportes'
import { esSoloConteo, tipoProducto } from '@/lib/productos-ui'
import type { CierreDia, ConteoVaso } from '@/types'
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
const CATALOGO = [...PRODUCTOS, PORCION, FAMILIAR]

const datos = (extra = {}) =>
  datosCierre({
    productos: CATALOGO,
    base_conteos: [
      ...datosCierre().base_conteos,
      { talla_id: null, producto_id: 'm-porcion', cantidad_final: 2 },
    ],
    ...extra,
  })

const conteoMasa = (productoId: string, inicio: number, final: number | null): ConteoVaso => ({
  id: `cv-${productoId}`,
  cierre_id: 'c1',
  producto_id: productoId,
  producto: CATALOGO.find((p) => p.id === productoId),
  cantidad_inicio: inicio,
  cantidad_nuevos: 0,
  cantidad_final: final,
  cantidad_gastada: null,
})

const cierre = (extra: Partial<CierreDia>): CierreDia => ({
  id: 'c1',
  fecha: '2026-10-07',
  usuario_id: 'u1',
  dinero_base_inicio: 50000,
  dinero_final: 60000,
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

describe('masas de pizza', () => {
  it('es un tipo de producto solo de conteo (sin precio)', () => {
    expect(tipoProducto(PORCION)).toBe('masa')
    expect(esSoloConteo('masa')).toBe(true)
    expect(esSoloConteo('comida')).toBe(false)
  })

  it('cierre nuevo: sugiere como inicio con las que terminó el último cierre', () => {
    const e = estadoDesdeDatos(datos())
    expect(e.masas.map((m) => [m.producto_id, m.cantidad_inicio, m.cantidad_final])).toEqual([
      ['m-porcion', 2, null],
      ['m-familiar', null, null],
    ])
  })

  it('borrador: conserva con cuántas empezó y terminó', () => {
    const e = estadoDesdeDatos(
      datos({ cierre: cierre({ conteo_vasos: [conteoMasa('m-familiar', 5, 1)] }) })
    )
    expect(e.masas.find((m) => m.producto_id === 'm-familiar')).toMatchObject({
      cantidad_inicio: 5,
      cantidad_final: 1,
    })
  })

  it('cierre cerrado: muestra las masas tal como se guardaron', () => {
    const e = estadoDesdeDatos(
      datos({
        cierre: cierre({ estado: 'cerrado', conteo_vasos: [conteoMasa('m-porcion', 6, 2)] }),
      })
    )
    expect(e.masas).toHaveLength(1)
    expect(masasUsadas(e.masas[0])).toBe(4)
  })

  it('el payload lleva inicio y final de cada masa', () => {
    const e = estadoDesdeDatos(datos())
    e.masas[0].cantidad_final = 1
    const p = construirPayload(e, { fecha: '2026-10-07', esAdmin: false, finalizar: false })
    expect(p.masas).toEqual([
      { producto_id: 'm-porcion', cantidad_inicio: 2, cantidad_final: 1, numero_masas: null },
      {
        producto_id: 'm-familiar',
        cantidad_inicio: null,
        cantidad_final: null,
        numero_masas: null,
      },
    ])
  })

  it('al finalizar exige anotarlas y no permite terminar con más de las que empezó', () => {
    const e: EstadoCierreForm = estadoDesdeDatos(datos())
    const faltan = validarCierre(e, CATALOGO, true).filter((x) => x.startsWith('Masas y unidades'))
    expect(faltan).toEqual(['Masas y unidades: falta anotar Porción, Unidades Familiar'])
    expect(pasoDeError(faltan[0])).toBe('masas')

    e.masas[0] = { ...e.masas[0], cantidad_inicio: 3, cantidad_final: 5 }
    expect(validarCierre(e, CATALOGO, false)).toContain(
      'Masas y unidades — Porción: terminó con 5 y empezó con 3'
    )
    // Guardar avance no exige las que faltan
    expect(validarCierre(e, CATALOGO, false).some((x) => x.includes('falta anotar'))).toBe(false)
  })

  it('pasos: Vasos, Comida, Masas y unidades, Caja y Revisar', () => {
    const e = estadoDesdeDatos(datos())
    const pasos = calcularPasos(e, { hayComida: true, porTalla: {}, errores: 1 })
    expect(pasos.map((p) => p.id)).toEqual(['vasos', 'comida', 'masas', 'caja', 'revisar'])
    expect(pasos.find((p) => p.id === 'masas')?.detalle).toBe('0 de 2')
  })

  it('la API solo acepta producto, inicio y final', () => {
    const p = normalizarPayloadCierre({
      fecha: '2026-10-07',
      masas: [{ producto_id: 'm-porcion', cantidad_inicio: '5', cantidad_final: '1', precio: 9 }],
    })
    expect(p.masas).toEqual([
      { producto_id: 'm-porcion', cantidad_inicio: 5, cantidad_final: 1, numero_masas: null },
    ])
  })

  it('el reporte lista las masas de los días cerrados', () => {
    const filas = masasDetalle([
      cierre({
        estado: 'cerrado',
        conteo_vasos: [
          { ...conteoMasa('m-familiar', 4, 1), numero_masas: 7 },
          conteoMasa('m-porcion', 5, 1),
        ],
      }),
      cierre({ fecha: '2026-10-08', conteo_vasos: [conteoMasa('m-porcion', 9, 0)] }),
    ])
    expect(filas).toEqual([
      { fecha: '2026-10-07', masa: 'Porción', empezo: 5, termino: 1, masas: null, usadas: 4 },
      {
        fecha: '2026-10-07',
        masa: 'Unidades Familiar',
        empezo: 4,
        termino: 1,
        masas: 7,
        usadas: 3,
      },
    ])
  })

  it('Pizzeta, Mediana y Familiar exigen el número de masas; Porción no', () => {
    const e = estadoDesdeDatos(datos())
    e.masas = e.masas.map((m) => ({ ...m, cantidad_inicio: 5, cantidad_final: 1 }))
    expect(validarCierre(e, CATALOGO, true)).toContain(
      'Masas y unidades: falta anotar Unidades Familiar'
    )
    e.masas[1] = { ...e.masas[1], numero_masas: 3 }
    expect(validarCierre(e, CATALOGO, true).some((x) => x.startsWith('Masas'))).toBe(false)
    const p = construirPayload(e, { fecha: '2026-10-07', esAdmin: false, finalizar: true })
    expect(p.masas.map((m) => m.numero_masas)).toEqual([null, 3])
  })
})
