import { describe, expect, it } from 'vitest'
import { esFechaISO, fechaColombia, sumarDias } from '@/lib/fechas'

describe('fechaColombia', () => {
  it('a las 9:30 p.m. en Colombia sigue siendo el mismo día aunque en UTC ya sea mañana', () => {
    expect(fechaColombia(new Date('2026-10-08T02:30:00Z'))).toBe('2026-10-07')
  })

  it('cambia de día a la medianoche de Colombia (05:00 UTC)', () => {
    expect(fechaColombia(new Date('2026-10-08T04:59:00Z'))).toBe('2026-10-07')
    expect(fechaColombia(new Date('2026-10-08T05:00:00Z'))).toBe('2026-10-08')
  })
})

describe('sumarDias', () => {
  it('cruza meses y años', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31')
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('esFechaISO', () => {
  it('valida el formato YYYY-MM-DD', () => {
    expect(esFechaISO('2026-10-07')).toBe(true)
    expect(esFechaISO('07/10/2026')).toBe(false)
    expect(esFechaISO(null)).toBe(false)
  })
})
