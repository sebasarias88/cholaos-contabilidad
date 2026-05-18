import { format, parseISO, startOfWeek, endOfWeek,
         startOfMonth, endOfMonth, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatFecha(fecha: string): string {
  return format(parseISO(fecha), "d 'de' MMMM yyyy", { locale: es })
}

export function getRangoFecha(rango: 'hoy' | 'semana' | 'quincena' | 'mes') {
  const hoy = new Date()
  switch (rango) {
    case 'hoy':
      return { desde: format(hoy, 'yyyy-MM-dd'), hasta: format(hoy, 'yyyy-MM-dd') }
    case 'semana':
      return {
        desde: format(startOfWeek(hoy, { locale: es }), 'yyyy-MM-dd'),
        hasta: format(endOfWeek(hoy, { locale: es }), 'yyyy-MM-dd'),
      }
    case 'quincena':
      return {
        desde: format(subDays(hoy, 15), 'yyyy-MM-dd'),
        hasta: format(hoy, 'yyyy-MM-dd'),
      }
    case 'mes':
      return {
        desde: format(startOfMonth(hoy), 'yyyy-MM-dd'),
        hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
      }
  }
}
