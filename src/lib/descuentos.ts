import { endOfMonth, format, startOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { fechaComoDate, hoyColombia } from '@/lib/fechas'
import type { DescuentoReporte, PersonaDescuento, TipoPersonaDescuento } from '@/types'

export const TIPOS_PERSONA: { id: TipoPersonaDescuento; label: string; plural: string }[] = [
  { id: 'empleado', label: 'Empleado', plural: 'Empleados' },
  { id: 'familia', label: 'Familia', plural: 'Familia' },
  { id: 'cliente', label: 'Cliente', plural: 'Clientes' },
]

export function etiquetaTipoPersona(tipo: TipoPersonaDescuento) {
  return TIPOS_PERSONA.find((t) => t.id === tipo)?.label ?? tipo
}

export function esTipoPersona(valor: unknown): valor is TipoPersonaDescuento {
  return valor === 'empleado' || valor === 'familia' || valor === 'cliente'
}

/** "  eliana   m " → "eliana m" (para comparar nombres sin importar espacios ni mayúsculas) */
export function claveNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

/** Busca por nombre sin importar tildes ni mayúsculas */
export function coincideNombre(nombre: string, busqueda: string) {
  const quitar = (s: string) => claveNombre(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  return quitar(nombre).includes(quitar(busqueda))
}

export interface ResumenPersona {
  persona: PersonaDescuento
  total: number
  pendiente: number
  descontado: number
  /** Pendiente de fechas anteriores al periodo */
  pendienteAnterior: number
  /** Fecha más antigua de lo pendiente anterior */
  pendienteAnteriorDesde: string | null
  descuentos: DescuentoReporte[]
}

/** Agrupa los descuentos del periodo por persona (más deuda pendiente primero) */
export function resumirPorPersona(
  personas: PersonaDescuento[],
  descuentos: DescuentoReporte[],
  pendienteAnterior: Record<string, { monto: number; desde: string }> = {},
  tipo: TipoPersonaDescuento | 'todos' = 'todos'
): ResumenPersona[] {
  const porPersona = new Map<string, DescuentoReporte[]>()
  for (const d of descuentos) {
    if (!d.persona_id) continue
    const lista = porPersona.get(d.persona_id) ?? []
    lista.push(d)
    porPersona.set(d.persona_id, lista)
  }

  const resumen: ResumenPersona[] = []
  for (const persona of personas) {
    if (tipo !== 'todos' && persona.tipo !== tipo) continue
    const lista = (porPersona.get(persona.id) ?? []).sort(
      (a, b) => a.fecha.localeCompare(b.fecha) || a.monto - b.monto
    )
    const anterior = pendienteAnterior[persona.id]?.monto ?? 0
    if (lista.length === 0 && anterior === 0) continue
    const total = lista.reduce((s, d) => s + d.monto, 0)
    const descontado = lista.filter((d) => d.liquidacion).reduce((s, d) => s + d.monto, 0)
    resumen.push({
      persona,
      total,
      descontado,
      pendiente: total - descontado,
      pendienteAnterior: anterior,
      pendienteAnteriorDesde: pendienteAnterior[persona.id]?.desde ?? null,
      descuentos: lista,
    })
  }

  return resumen.sort(
    (a, b) =>
      b.pendiente - a.pendiente ||
      b.total - a.total ||
      a.persona.nombre.localeCompare(b.persona.nombre, 'es')
  )
}

export function totalesResumen(resumen: ResumenPersona[]) {
  return resumen.reduce(
    (t, r) => ({
      total: t.total + r.total,
      pendiente: t.pendiente + r.pendiente,
      descontado: t.descontado + r.descontado,
    }),
    { total: 0, pendiente: 0, descontado: 0 }
  )
}

export type PresetNomina =
  | 'semana'
  | 'quincena'
  | 'quincena-pasada'
  | 'mes'
  | 'mes-pasado'
  | 'custom'

export const PRESETS_NOMINA: { id: PresetNomina; label: string }[] = [
  { id: 'semana', label: 'Esta semana' },
  { id: 'quincena', label: 'Esta quincena' },
  { id: 'quincena-pasada', label: 'Quincena pasada' },
  { id: 'mes', label: 'Este mes' },
  { id: 'mes-pasado', label: 'Mes pasado' },
  { id: 'custom', label: 'Personalizado' },
]

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/** Quincenas de nómina: del 1 al 15 y del 16 al último día del mes */
export function rangoNomina(
  preset: Exclude<PresetNomina, 'custom'>,
  hoy: string = hoyColombia()
): { desde: string; hasta: string } {
  const d = fechaComoDate(hoy)
  const primera = (m: Date) => ({
    desde: iso(startOfMonth(m)),
    hasta: iso(startOfMonth(m)).slice(0, 8) + '15',
  })
  const segunda = (m: Date) => ({
    desde: iso(startOfMonth(m)).slice(0, 8) + '16',
    hasta: iso(endOfMonth(m)),
  })
  switch (preset) {
    case 'semana':
      return {
        desde: iso(startOfWeek(d, { locale: es })),
        hasta: iso(endOfWeek(d, { locale: es })),
      }
    case 'quincena':
      return d.getDate() <= 15 ? primera(d) : segunda(d)
    case 'quincena-pasada':
      return d.getDate() <= 15 ? segunda(subMonths(d, 1)) : primera(d)
    case 'mes':
      return { desde: iso(startOfMonth(d)), hasta: iso(endOfMonth(d)) }
    case 'mes-pasado': {
      const m = subMonths(d, 1)
      return { desde: iso(startOfMonth(m)), hasta: iso(endOfMonth(m)) }
    }
  }
}
