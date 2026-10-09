import { describe, expect, it } from 'vitest'
import {
  claveNombre,
  coincideNombre,
  rangoNomina,
  resumirPorPersona,
  totalesResumen,
} from '@/lib/descuentos'
import type { DescuentoReporte, PersonaDescuento } from '@/types'

const persona = (id: string, nombre: string, tipo: PersonaDescuento['tipo']): PersonaDescuento => ({
  id,
  nombre,
  tipo,
  activo: true,
  created_at: '',
})

const PERSONAS = [
  persona('pe1', 'Eliana', 'empleado'),
  persona('pe2', 'Leo', 'empleado'),
  persona('pe3', 'Camila', 'empleado'),
  persona('pe4', 'Papá', 'familia'),
  persona('pe5', 'Sin movimientos', 'cliente'),
]

const LIQ = { id: 'li1', desde: '2026-10-01', hasta: '2026-10-05', total: 9000, created_at: '' }
const d = (
  id: string,
  persona_id: string,
  fecha: string,
  monto: number,
  liquidado = false
): DescuentoReporte => ({
  id,
  persona_id,
  fecha,
  monto,
  descripcion: '',
  liquidacion: liquidado ? LIQ : null,
})

const DESCUENTOS = [
  d('a', 'pe1', '2026-10-08', 2900),
  d('b', 'pe2', '2026-10-08', 8000),
  d('c', 'pe1', '2026-10-08', 4500),
  d('d', 'pe3', '2026-10-08', 17000),
  d('e', 'pe4', '2026-10-08', 81000),
  d('f', 'pe3', '2026-10-03', 9000, true),
]

describe('descuentos por persona', () => {
  it('suma total, pendiente y descontado de cada persona', () => {
    const r = resumirPorPersona(PERSONAS, DESCUENTOS)
    const camila = r.find((x) => x.persona.nombre === 'Camila')!
    expect(camila).toMatchObject({ total: 26000, pendiente: 17000, descontado: 9000 })
    expect(camila.descuentos.map((x) => x.fecha)).toEqual(['2026-10-03', '2026-10-08'])
    const eliana = r.find((x) => x.persona.nombre === 'Eliana')!
    expect(eliana).toMatchObject({ total: 7400, pendiente: 7400, descontado: 0 })
    // Primero quien más debe; quien no tiene nada no aparece
    expect(r.map((x) => x.persona.nombre)).toEqual(['Papá', 'Camila', 'Leo', 'Eliana'])
  })

  it('filtra por tipo y suma los totales', () => {
    const empleados = resumirPorPersona(PERSONAS, DESCUENTOS, {}, 'empleado')
    expect(empleados.map((x) => x.persona.nombre)).not.toContain('Papá')
    expect(totalesResumen(empleados)).toEqual({ total: 41400, pendiente: 32400, descontado: 9000 })
    expect(totalesResumen(resumirPorPersona(PERSONAS, DESCUENTOS)).total).toBe(122400)
  })

  it('muestra lo pendiente de antes del periodo aunque no tenga descuentos nuevos', () => {
    const r = resumirPorPersona(PERSONAS, [], { pe2: { monto: 6000, desde: '2026-09-20' } })
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({
      total: 0,
      pendienteAnterior: 6000,
      pendienteAnteriorDesde: '2026-09-20',
    })
  })

  it('compara nombres sin importar mayúsculas, espacios ni tildes', () => {
    expect(claveNombre('  eliana   M ')).toBe('eliana m')
    expect(coincideNombre('Papá', 'papa')).toBe(true)
    expect(coincideNombre('Eliana', 'ELI')).toBe(true)
    expect(coincideNombre('Leo', 'eli')).toBe(false)
  })

  it('quincenas de nómina: del 1 al 15 y del 16 a fin de mes', () => {
    expect(rangoNomina('quincena', '2026-10-09')).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-15',
    })
    expect(rangoNomina('quincena', '2026-10-20')).toEqual({
      desde: '2026-10-16',
      hasta: '2026-10-31',
    })
    expect(rangoNomina('quincena-pasada', '2026-10-09')).toEqual({
      desde: '2026-09-16',
      hasta: '2026-09-30',
    })
    expect(rangoNomina('quincena-pasada', '2026-10-20')).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-15',
    })
    expect(rangoNomina('mes-pasado', '2026-03-10')).toEqual({
      desde: '2026-02-01',
      hasta: '2026-02-28',
    })
    expect(rangoNomina('mes', '2026-10-09')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' })
  })
})
