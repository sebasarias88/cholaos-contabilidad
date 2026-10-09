import { describe, expect, it } from 'vitest'
import { normalizarPayloadCierre } from '@/lib/cierre/api'
import {
  construirPayload,
  estadoDesdeDatos,
  itemsVendidos,
  validarCierre,
} from '@/lib/cierre/estado'
import { totalVasosGastadosCierre } from '@/lib/cierre/historial'
import { calcularPasos, pasoDeError } from '@/lib/cierre/pasos'
import { vendidosReales } from '@/lib/cierre/ventas-vasos'
import { esBebidaContada } from '@/lib/productos-ui'
import type { CierreDia, ConteoVaso } from '@/types'
import { datosCierre, producto, PRODUCTOS } from './fixtures'

const AGUA = producto({
  id: 'b-agua',
  nombre: 'Botella Con Agua',
  tipo: 'comida',
  unidad: 'unidad',
  precio: 2000,
  conteo_inventario: true,
})
const GASEOSA_15 = producto({
  id: 'b-gas15',
  nombre: 'Gaseosa 1.5L',
  tipo: 'comida',
  unidad: 'unidad',
  precio: 8000,
  conteo_inventario: true,
})
const CATALOGO = [...PRODUCTOS, AGUA, GASEOSA_15]

const datos = (extra = {}) =>
  datosCierre({
    productos: CATALOGO,
    base_conteos: [
      ...datosCierre().base_conteos,
      { talla_id: null, producto_id: 'b-agua', cantidad_final: 12 },
    ],
    ...extra,
  })

const conteoBebida = (productoId: string, extra: Partial<ConteoVaso>): ConteoVaso => ({
  id: `cv-${productoId}`,
  cierre_id: 'c1',
  producto_id: productoId,
  producto: CATALOGO.find((p) => p.id === productoId),
  cantidad_inicio: 12,
  cantidad_nuevos: 0,
  cantidad_final: null,
  cantidad_gastada: null,
  ...extra,
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

describe('bebidas contadas como los vasos', () => {
  it('solo la comida marcada y sin variantes se cuenta', () => {
    expect(esBebidaContada(AGUA)).toBe(true)
    expect(esBebidaContada({ ...AGUA, conteo_inventario: false })).toBe(false)
    expect(esBebidaContada({ ...AGUA, tiene_variantes: true })).toBe(false)
    expect(esBebidaContada({ ...AGUA, tipo: 'insumo' })).toBe(false)
  })

  it('cierre nuevo: inicio = con las que terminó el último cierre', () => {
    const e = estadoDesdeDatos(datos())
    expect(e.bebidas.map((b) => [b.producto_id, b.cantidad_inicio, b.cantidad_final])).toEqual([
      ['b-agua', 12, null],
      ['b-gas15', 0, null],
    ])
  })

  it('vendidas = inicio + llegaron − quedan − novedades, y suman al total con su precio', () => {
    const e = estadoDesdeDatos(datos())
    e.bebidas[0] = {
      ...e.bebidas[0],
      cantidad_nuevos: 24,
      cantidad_final: 20,
      novedades: [{ motivo_id: 'm1', cantidad: 1 }],
    }
    expect(vendidosReales(e.bebidas[0])).toBe(15)
    const total = itemsVendidos(e, CATALOGO).reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
    expect(total).toBe(15 * 2000)
  })

  it('el payload las manda aparte (no como comida) con sus novedades', () => {
    const e = estadoDesdeDatos(datos())
    e.bebidas[0] = {
      ...e.bebidas[0],
      cantidad_final: 10,
      novedades: [{ motivo_id: 'm1', cantidad: 0 }],
    }
    const p = construirPayload(e, { fecha: '2026-10-07', esAdmin: false, finalizar: false })
    expect(p.bebidas[0]).toEqual({
      producto_id: 'b-agua',
      cantidad_nuevos: 0,
      cantidad_final: 10,
      novedades: [],
    })
    expect(p.ventas_comida).toEqual([])
  })

  it('borrador: recupera el conteo y no repite la venta guardada en Comida', () => {
    const e = estadoDesdeDatos(
      datos({
        cierre: cierre({
          conteo_vasos: [conteoBebida('b-agua', { cantidad_nuevos: 6, cantidad_final: 8 })],
          ventas_comida: [
            {
              id: 'vc1',
              cierre_id: 'c1',
              producto_id: 'b-agua',
              cantidad: 10,
              precio_unitario: 2000,
            },
            {
              id: 'vc2',
              cierre_id: 'c1',
              producto_id: 'p-gaseosa',
              cantidad: 2,
              precio_unitario: 4500,
            },
          ],
        }),
      })
    )
    expect(e.bebidas[0]).toMatchObject({ cantidad_nuevos: 6, cantidad_final: 8 })
    expect(e.ventasComida).toEqual([{ producto_id: 'p-gaseosa', cantidad: 2 }])
  })

  it('cierre cerrado: muestra las bebidas guardadas', () => {
    const e = estadoDesdeDatos(
      datos({
        cierre: cierre({
          estado: 'cerrado',
          conteo_vasos: [conteoBebida('b-gas15', { cantidad_inicio: 5, cantidad_final: 2 })],
        }),
      })
    )
    expect(e.bebidas).toHaveLength(1)
    expect(vendidosReales(e.bebidas[0])).toBe(3)
  })

  it('valida conteo final, que no queden más de las que había y las novedades', () => {
    const e = estadoDesdeDatos(datos())
    const faltan = validarCierre(e, CATALOGO, true).filter((x) => x.startsWith('Bebidas'))
    expect(faltan).toEqual(['Bebidas: falta el conteo final de Botella Con Agua, Gaseosa 1.5L'])
    expect(pasoDeError(faltan[0])).toBe('comida')

    e.bebidas[0] = { ...e.bebidas[0], cantidad_final: 13 }
    e.bebidas[1] = {
      ...e.bebidas[1],
      cantidad_nuevos: 4,
      cantidad_final: 3,
      novedades: [{ motivo_id: 'm1', cantidad: 2 }],
    }
    expect(validarCierre(e, CATALOGO, false)).toEqual([
      'Bebidas — Botella Con Agua: quedan 13 y solo había 12',
      'Bebidas — Gaseosa 1.5L: hay más novedades (2) que unidades que salieron (1)',
    ])
  })

  it('las bebidas van dentro del paso Comida (no hay paso aparte)', () => {
    const pasos = calcularPasos(estadoDesdeDatos(datos()), {
      hayComida: true,
      porTalla: {},
      errores: 0,
    })
    expect(pasos.map((p) => p.id)).toEqual(['vasos', 'comida', 'caja', 'revisar'])
    // 2 bebidas + 1 insumo (Barquillo del catálogo de prueba) por contar
    expect(pasos[1].detalle).toBe('0 de 3 contados')
  })

  it('la API solo acepta conteo y novedades (nunca precio)', () => {
    const p = normalizarPayloadCierre({
      fecha: '2026-10-07',
      bebidas: [
        {
          producto_id: 'b-agua',
          cantidad_nuevos: '3',
          cantidad_final: '1',
          precio: 1,
          novedades: [],
        },
      ],
    })
    expect(p.bebidas).toEqual([
      { producto_id: 'b-agua', cantidad_nuevos: 3, cantidad_final: 1, novedades: [] },
    ])
  })

  it('el total de vasos del historial no cuenta bebidas', () => {
    const vaso: ConteoVaso = {
      ...conteoBebida('x', {}),
      producto_id: undefined,
      talla_id: 't16',
      cantidad_inicio: 10,
      cantidad_final: 4,
    }
    expect(
      totalVasosGastadosCierre([
        vaso,
        conteoBebida('b-agua', { cantidad_inicio: 10, cantidad_final: 0 }),
      ])
    ).toBe(6)
  })
})
