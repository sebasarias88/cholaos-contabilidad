import { describe, expect, it } from 'vitest'
import { normalizarPayloadCierre } from '@/lib/cierre/api'
import { normalizarVariante } from '@/lib/variantes'

describe('normalizarPayloadCierre', () => {
  it('descarta campos desconocidos (no se pueden inyectar precios)', () => {
    const p = normalizarPayloadCierre({
      fecha: '2026-10-07',
      total_ventas: 999999,
      ventas_comida: [{ producto_id: 'x', cantidad: '2', precio_unitario: 1 }],
    })
    expect(p).not.toHaveProperty('total_ventas')
    expect(p.ventas_comida).toEqual([{ producto_id: 'x', cantidad: 2 }])
  })

  it('finalizar es true salvo que se pida explícitamente guardar avance', () => {
    expect(normalizarPayloadCierre({ fecha: '2026-10-07' }).finalizar).toBe(true)
    expect(normalizarPayloadCierre({ fecha: '2026-10-07', finalizar: false }).finalizar).toBe(false)
  })

  it('un final vacío llega como null (no como 0)', () => {
    const p = normalizarPayloadCierre({ vasos: [{ talla_id: 't', cantidad_final: '' }] })
    expect(p.vasos[0].cantidad_final).toBeNull()
  })
})

describe('normalizarVariante', () => {
  it('solo deja nombre, precio, orden y activo', () => {
    const r = normalizarVariante(
      { nombre: ' Mesa ', precio: '9000', producto_id: 'otro', id: 'x' },
      false
    )
    expect(r).toEqual({ data: { nombre: 'Mesa', precio: 9000 } })
  })

  it('rechaza precio inválido', () => {
    expect(normalizarVariante({ nombre: 'Mesa', precio: -1 }, false)).toHaveProperty('error')
  })
})
