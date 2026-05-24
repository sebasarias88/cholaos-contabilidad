import { format, parseISO, startOfWeek, endOfWeek,
         startOfMonth, endOfMonth, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TallaVaso, TipoVaso } from '@/types'

const TIPOS_VASO_VALIDOS: TipoVaso[] = ['normal', 'ancho', 'angosto']

export function esTipoVaso(val: unknown): val is TipoVaso {
  return typeof val === 'string' && TIPOS_VASO_VALIDOS.includes(val as TipoVaso)
}

/** Ej: "14 oz (ancho)" — normal solo muestra onzas */
export function formatTalla(
  talla: Pick<TallaVaso, 'onzas' | 'tipo'> | { onzas: number; tipo?: TipoVaso }
): string {
  const tipo = talla.tipo ?? 'normal'
  if (tipo === 'normal') return `${talla.onzas} oz`
  return `${talla.onzas} oz (${tipo})`
}

export function etiquetaTipoVaso(tipo: TipoVaso): string {
  const map: Record<TipoVaso, string> = {
    normal: 'Normal',
    ancho: 'Ancho',
    angosto: 'Angosto',
  }
  return map[tipo]
}

export function formatPesos(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

/** Entero COP → texto para input con símbolo $ y separadores de miles */
export function formatPesosInput(valor: number): string {
  if (!valor) return ''
  return formatPesos(valor)
}

/** Texto del input → entero COP (solo dígitos) */
export function parsePesosInput(val: string): number {
  const n = Number(String(val).replace(/\D/g, ''))
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

export function formatFecha(fecha: string): string {
  return format(parseISO(fecha), "d 'de' MMMM yyyy", { locale: es })
}

export function formatFechaHoy() {
  return format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
}

export function getIniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function generarPassword(longitud = 12): string {
  const chars =
    'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
  const arr = new Uint8Array(longitud)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}

/** Lunes de la semana actual → hoy (para reportes del dashboard) */
export function getSemanaHastaHoy() {
  const hoy = new Date()
  return {
    desde: format(startOfWeek(hoy, { locale: es }), 'yyyy-MM-dd'),
    hasta: format(hoy, 'yyyy-MM-dd'),
  }
}

/** Últimos 7 días incluyendo hoy */
export function getUltimos7Dias() {
  const hoy = new Date()
  return {
    desde: format(subDays(hoy, 6), 'yyyy-MM-dd'),
    hasta: format(hoy, 'yyyy-MM-dd'),
  }
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
