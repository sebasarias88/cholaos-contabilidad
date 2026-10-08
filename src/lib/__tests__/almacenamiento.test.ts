import { describe, expect, it } from 'vitest'
import {
  crecimientoDiario,
  diasHastaLlenar,
  formatBytes,
  LIMITE_BD_BYTES,
  nivelUso,
} from '@/lib/almacenamiento'

const MB = 1024 * 1024

describe('almacenamiento', () => {
  it('formatea tamaños', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(12.7 * MB)).toBe('12.7 MB')
  })

  it('nivel de uso según umbrales', () => {
    expect(nivelUso(100 * MB)).toBe('normal')
    expect(nivelUso(LIMITE_BD_BYTES * 0.75)).toBe('aviso')
    expect(nivelUso(LIMITE_BD_BYTES * 0.95)).toBe('critico')
  })

  it('no estima crecimiento con menos de una semana de historial', () => {
    expect(
      crecimientoDiario([
        { fecha: '2026-10-01', bytes: 10 * MB },
        { fecha: '2026-10-03', bytes: 11 * MB },
      ])
    ).toBeNull()
  })

  it('estima días hasta llenar el plan', () => {
    const porDia = crecimientoDiario([
      { fecha: '2026-10-01', bytes: 10 * MB },
      { fecha: '2026-10-11', bytes: 20 * MB },
    ])
    expect(porDia).toBe(MB)
    expect(diasHastaLlenar(20 * MB, porDia)).toBe(480)
  })
})
