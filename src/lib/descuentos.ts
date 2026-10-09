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

/**
 * Qué se hace con lo que se le descuenta a cada tipo de persona:
 * al empleado se le descuenta del sueldo, al cliente se le cobra y
 * a la familia no se le cobra (solo queda el registro de lo que se le dio).
 */
export type TextosCuenta = {
  /** Lo que falta: "Pendiente" / "Por cobrar" */
  pendiente: string
  /** Lo ya saldado: "Descontado" / "Cobrado" */
  saldado: string
  /** Botón: "Descontar del sueldo" / "Marcar como cobrado" */
  accion: string
  /** Título del modal */
  tituloAccion: (nombre: string) => string
  /** "descontados" / "cobrados" (para frases) */
  participio: string
  /** Etiqueta larga para el historial y el cierre */
  saldadoLargo: string
  /** Comprobante en PDF */
  comprobante: string
}

const TEXTOS_CUENTA: Record<'empleado' | 'cliente', TextosCuenta> = {
  empleado: {
    pendiente: 'Pendiente',
    saldado: 'Descontado',
    accion: 'Descontar del sueldo',
    tituloAccion: (nombre) => `Descontar del sueldo a ${nombre}`,
    participio: 'descontados del sueldo',
    saldadoLargo: 'Descontado del sueldo',
    comprobante: 'Comprobante de descuentos',
  },
  cliente: {
    pendiente: 'Por cobrar',
    saldado: 'Cobrado',
    accion: 'Marcar como cobrado',
    tituloAccion: (nombre) => `Marcar como cobrado a ${nombre}`,
    participio: 'cobrados',
    saldadoLargo: 'Cobrado',
    comprobante: 'Cuenta de cobro',
  },
}

/** null = no se cobra ni se descuenta (familia) */
export function textosCuenta(tipo: TipoPersonaDescuento | null | undefined): TextosCuenta | null {
  if (tipo === 'empleado' || tipo === 'cliente') return TEXTOS_CUENTA[tipo]
  return null
}

/** A la familia no se le cobra nada */
export function seCobra(tipo: TipoPersonaDescuento | null | undefined) {
  return textosCuenta(tipo) !== null
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
    const cobra = seCobra(persona.tipo)
    // A la familia no se le cobra: no hay pendientes ni cosas de antes que recordar
    const anterior = cobra ? (pendienteAnterior[persona.id]?.monto ?? 0) : 0
    if (lista.length === 0 && anterior === 0) continue
    const total = lista.reduce((s, d) => s + d.monto, 0)
    const descontado = cobra
      ? lista.filter((d) => d.liquidacion).reduce((s, d) => s + d.monto, 0)
      : 0
    resumen.push({
      persona,
      total,
      descontado,
      pendiente: cobra ? total - descontado : 0,
      pendienteAnterior: anterior,
      pendienteAnteriorDesde: cobra ? (pendienteAnterior[persona.id]?.desde ?? null) : null,
      descuentos: lista,
    })
  }

  // Primero empleados, luego clientes y al final familia; dentro de cada grupo, quien más debe
  const orden: Record<TipoPersonaDescuento, number> = { empleado: 0, cliente: 1, familia: 2 }
  return resumen.sort(
    (a, b) =>
      orden[a.persona.tipo] - orden[b.persona.tipo] ||
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
      familia: t.familia + (seCobra(r.persona.tipo) ? 0 : r.total),
    }),
    { total: 0, pendiente: 0, descontado: 0, familia: 0 }
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
