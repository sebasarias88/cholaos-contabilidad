/**
 * Fechas del negocio — siempre en hora de Colombia.
 * El servidor (Vercel) corre en UTC: nunca usar format(new Date()) para "hoy".
 */
export const ZONA_HORARIA_NEGOCIO = 'America/Bogota'

const formatoISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_NEGOCIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** 'YYYY-MM-DD' de un instante, en hora de Colombia */
export function fechaColombia(instante: Date = new Date()): string {
  return formatoISO.format(instante)
}

/** Hoy en Colombia como 'YYYY-MM-DD' */
export function hoyColombia(): string {
  return fechaColombia()
}

/** Suma (o resta) días a una fecha 'YYYY-MM-DD' sin depender de la zona horaria */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + dias))
  return utc.toISOString().slice(0, 10)
}

export function esFechaISO(valor: unknown): valor is string {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
}

/** Date local (mediodía) para usar con date-fns sin saltos de día */
export function fechaComoDate(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
