import { describe, expect, it } from 'vitest'
import {
  construirPayload,
  estadoDesdeDatos,
  itemsVendidos,
  validarCierre,
} from '@/lib/cierre/estado'
import type { CierreDia, ConteoVaso } from '@/types'
import { datosCierre, PRODUCTOS, T14 } from './fixtures'

function cierreGuardado(extra: Partial<CierreDia>): CierreDia {
  return {
    id: 'c1',
    fecha: '2026-10-07',
    usuario_id: 'u1',
    dinero_base_inicio: 50000,
    dinero_final: 0,
    total_transferencias: 0,
    total_gastos: 8000,
    total_domicilios: 0,
    total_ventas: 0,
    efectivo_esperado: 0,
    diferencia: 0,
    estado: 'borrador',
    created_at: '',
    updated_at: '',
    gastos: [{ id: 'g1', cierre_id: 'c1', descripcion: 'hielo', monto: 8000, created_at: '' }],
    ...extra,
  }
}

const conteo = (extra: Partial<ConteoVaso>): ConteoVaso => ({
  id: 'cv',
  cierre_id: 'c1',
  cantidad_inicio: 6,
  cantidad_nuevos: 0,
  cantidad_final: null,
  cantidad_gastada: null,
  ...extra,
})

describe('estadoDesdeDatos', () => {
  it('cierre nuevo: una fila por vaso físico con inicio = final del último cierre', () => {
    const e = estadoDesdeDatos(datosCierre())
    expect(e.vasos.map((v) => [v.talla_id, v.cantidad_inicio, v.cantidad_final])).toEqual([
      ['t16', 4, null],
      ['t14', 6, null],
    ])
    expect(e.insumos[0]).toMatchObject({ producto_id: 'p-barquillo', cantidad_inicio: 10 })
    expect(e.dineroBase).toBe(50000)
  })

  it('borrador: conserva lo guardado y agrega productos nuevos del catálogo', () => {
    const e = estadoDesdeDatos(
      datosCierre({
        cierre: cierreGuardado({
          conteo_vasos: [
            conteo({
              talla_id: 't14',
              talla: T14,
              cantidad_nuevos: 20,
              desglose: [{ producto_id: 'p-cholao', cantidad: 3 }],
            }),
          ],
        }),
      })
    )
    const t14 = e.vasos.find((v) => v.talla_id === 't14')!
    expect(t14.cantidad_nuevos).toBe(20)
    expect(t14.cantidad_final).toBeNull()
    expect(t14.desglose).toEqual([{ producto_id: 'p-cholao', cantidad: 3 }])
    expect(e.vasos).toHaveLength(2)
    expect(e.gastos).toHaveLength(1)
  })

  it('cerrado: muestra solo lo que se guardó ese día', () => {
    const e = estadoDesdeDatos(
      datosCierre({
        cierre: cierreGuardado({
          estado: 'cerrado',
          conteo_vasos: [conteo({ talla_id: 't14', talla: T14, cantidad_final: 2 })],
        }),
      })
    )
    expect(e.vasos).toHaveLength(1)
    expect(e.insumos).toHaveLength(0)
  })
})

describe('construirPayload', () => {
  const estado = estadoDesdeDatos(datosCierre())

  it('el empleado nunca envía la base inicial', () => {
    const p = construirPayload(estado, { fecha: '2026-10-07', esAdmin: false, finalizar: false })
    expect(p).not.toHaveProperty('dinero_base_inicio')
    expect(p.finalizar).toBe(false)
  })

  it('el admin sí puede enviar la base', () => {
    const p = construirPayload(estado, { fecha: '2026-10-07', esAdmin: true, finalizar: true })
    expect(p.dinero_base_inicio).toBe(50000)
  })

  it('omite ventas en cero', () => {
    const p = construirPayload(
      { ...estado, ventasComida: [{ producto_id: 'p-gaseosa', cantidad: 0 }] },
      { fecha: '2026-10-07', esAdmin: false, finalizar: true }
    )
    expect(p.ventas_comida).toEqual([])
  })
})

describe('validarCierre', () => {
  const estado = estadoDesdeDatos(datosCierre())

  it('guardar avance permite conteos vacíos', () => {
    expect(validarCierre(estado, PRODUCTOS, false)).toEqual([])
  })

  it('finalizar exige conteos completos y dinero contado', () => {
    const errores = validarCierre(estado, PRODUCTOS, true)
    expect(errores[0]).toContain('Falta el conteo final')
    expect(errores.at(-1)).toContain('dinero final')
  })

  it('el final no puede superar lo disponible', () => {
    const conFinal = {
      ...estado,
      vasos: estado.vasos.map((v) => ({ ...v, cantidad_final: 99 })),
    }
    expect(validarCierre(conFinal, PRODUCTOS, false).join(' ')).toContain('mayor que lo disponible')
  })
})

describe('itemsVendidos', () => {
  it('suma vasos, variantes y comida con precio del catálogo', () => {
    const base = estadoDesdeDatos(datosCierre())
    const items = itemsVendidos(
      {
        ...base,
        vasos: base.vasos.map((v) =>
          v.talla_id === 't16' ? { ...v, cantidad_nuevos: 10, cantidad_final: 6 } : v
        ),
        ventasComida: [{ producto_id: 'p-gaseosa', cantidad: 2 }],
        ventasVariantes: [{ variante_id: 'v-mesa', cantidad: 3 }],
      },
      PRODUCTOS
    )
    expect(items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)).toBe(
      8 * 15000 + 2 * 4500 + 3 * 9000
    )
  })
})
