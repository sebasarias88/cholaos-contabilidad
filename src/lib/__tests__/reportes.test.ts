import { describe, expect, it } from 'vitest'
import { construirFilas } from '@/lib/export-reportes'
import { fillRango } from '@/lib/reportes'
import type { CierreDia } from '@/types'

const cierre = (fecha: string, estado: CierreDia['estado'], ventas: number): CierreDia => ({
  id: fecha,
  fecha,
  usuario_id: 'u',
  dinero_base_inicio: 0,
  dinero_final: ventas - 1000,
  total_transferencias: 0,
  total_gastos: 0,
  total_domicilios: 0,
  total_ventas: ventas,
  efectivo_esperado: ventas,
  diferencia: -1000,
  estado,
  created_at: '',
  updated_at: '',
})

describe('fillRango', () => {
  it('rellena los días sin ventas con ceros', () => {
    const r = fillRango(
      [{ fecha: '2026-10-02', ingresos: 5, total_vasos: 1, total_ventas: 1 }],
      '2026-10-01',
      '2026-10-03'
    )
    expect(r.map((d) => d.ingresos)).toEqual([0, 5, 0])
  })
})

describe('construirFilas (exportes)', () => {
  it('excluye borradores y suma totales', () => {
    const { dias, totales } = construirFilas({
      nombreNegocio: 'X',
      desde: '2026-10-01',
      hasta: '2026-10-03',
      resumen: [],
      productos: [],
      cierres: [cierre('2026-10-01', 'cerrado', 100000), cierre('2026-10-02', 'borrador', 50000)],
    })
    expect(dias).toHaveLength(1)
    expect(totales.ingresos).toBe(100000)
    expect(totales.diferencia).toBe(-1000)
    expect(totales.diasPeriodo).toBe(3)
  })
})
