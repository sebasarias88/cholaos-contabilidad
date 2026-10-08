import { describe, expect, it } from 'vitest'
import {
  calcularItemsVendidos,
  erroresDesgloseVasos,
  vasosGastados,
  vendidosReales,
} from '@/lib/cierre/ventas-vasos'
import { PRODUCTOS } from './fixtures'

const fila = (extra = {}) => ({
  talla_id: 't14',
  cantidad_inicio: 6,
  cantidad_nuevos: 20,
  cantidad_final: 10,
  novedades: [],
  desglose: [],
  ...extra,
})

describe('vasos vendidos', () => {
  it('sin conteo final no hay vasos gastados', () => {
    expect(vasosGastados(fila({ cantidad_final: null }))).toBe(0)
  })

  it('vendidos = inicio + nuevos − final − novedades', () => {
    expect(vasosGastados(fila())).toBe(16)
    expect(vendidosReales(fila({ novedades: [{ motivo_id: 'm', cantidad: 1 }] }))).toBe(15)
  })
})

describe('calcularItemsVendidos', () => {
  it('un solo producto en el vaso recibe todo lo vendido', () => {
    const items = calcularItemsVendidos(
      [fila({ talla_id: 't16', cantidad_inicio: 4, cantidad_nuevos: 10, cantidad_final: 6 })],
      PRODUCTOS
    )
    expect(items).toEqual([{ producto_id: 'p-extra', cantidad: 8, precio_unitario: 15000 }])
  })

  it('varios productos usan el desglose', () => {
    const items = calcularItemsVendidos(
      [
        fila({
          desglose: [
            { producto_id: 'p-cholao', cantidad: 10 },
            { producto_id: 'p-malteada', cantidad: 6 },
          ],
        }),
      ],
      PRODUCTOS
    )
    expect(items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)).toBe(226000)
  })
})

describe('erroresDesgloseVasos', () => {
  it('exige que el desglose sume lo vendido cuando el vaso es compartido', () => {
    const errores = erroresDesgloseVasos(
      [fila({ desglose: [{ producto_id: 'p-cholao', cantidad: 3 }] })],
      PRODUCTOS,
      () => '14 oz ancho'
    )
    expect(errores[0]).toContain('el desglose suma 3 y se vendieron 16')
  })

  it('no exige desglose si el vaso tiene un solo producto', () => {
    expect(erroresDesgloseVasos([fila({ talla_id: 't16' })], PRODUCTOS, () => '')).toEqual([])
  })
})
