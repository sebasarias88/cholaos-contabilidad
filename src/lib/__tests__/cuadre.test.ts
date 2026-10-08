import { describe, expect, it } from 'vitest'
import { calcularCuadre, estadoCuadre } from '@/lib/cierre/cuadre'

describe('calcularCuadre', () => {
  const base = {
    dineroBaseInicio: 50000,
    itemsVendidos: [
      { cantidad: 8, precio_unitario: 15000 },
      { cantidad: 2, precio_unitario: 4500 },
    ],
    transferencias: [{ monto: 50000 }],
    gastos: [{ monto: 10000 }],
    domicilios: [{ monto: 5000 }],
  }

  it('esperado = base + ventas − transferencias − gastos − domicilios', () => {
    const c = calcularCuadre({ ...base, dineroFinal: 114000 })
    expect(c.totalVentas).toBe(129000)
    expect(c.efectivoEsperado).toBe(114000)
    expect(c.diferencia).toBe(0)
    expect(c.cuadreOk).toBe(true)
  })

  it('reporta faltante y sobrante', () => {
    expect(calcularCuadre({ ...base, dineroFinal: 110000 }).diferencia).toBe(-4000)
    expect(calcularCuadre({ ...base, dineroFinal: 120000 }).diferencia).toBe(6000)
  })
})

describe('estadoCuadre', () => {
  it('pendiente mientras no se cuente el dinero', () => {
    expect(estadoCuadre(0, -5000)).toBe('pendiente')
    expect(estadoCuadre(1000, 0)).toBe('ok')
    expect(estadoCuadre(1000, -1)).toBe('falta')
    expect(estadoCuadre(1000, 1)).toBe('sobra')
  })
})
