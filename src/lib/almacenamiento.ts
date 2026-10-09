/** Plan gratuito de Supabase: 500 MB de base de datos por proyecto */
export const LIMITE_BD_BYTES = 500 * 1024 * 1024

/** Palabra que el admin debe escribir para borrar datos */
export const TEXTO_CONFIRMACION = 'BORRAR'

/** Umbrales para avisar al admin */
const UMBRAL_AVISO = 0.7
const UMBRAL_CRITICO = 0.9

export type UsoTabla = { tabla: string; filas: number; bytes: number }
export type PuntoUso = { fecha: string; bytes: number }

export interface UsoAlmacenamiento {
  bytes_total: number
  tablas: UsoTabla[]
  cierres: number
  primer_cierre: string | null
  ultimo_cierre: string | null
  historial: PuntoUso[]
}

export interface VistaPreviaLimpieza {
  hasta: string
  ultimo_cierre: string | null
  desde: string | null
  cierres: number
  ventas: number
  gastos: number
}

const NOMBRES_TABLA: Record<string, string> = {
  cierres_dia: 'Cierres del día',
  conteo_vasos: 'Conteos de inventario',
  novedades_vasos: 'Novedades de vasos',
  gastos_dia: 'Gastos',
  transferencias_dia: 'Transferencias',
  domicilios_dia: 'Domicilios',
  descuentos_dia: 'Descuentos',
  personas_descuento: 'Personas (descuentos)',
  liquidaciones_descuento: 'Descuentos del sueldo',
  ventas: 'Ventas',
  detalle_ventas: 'Detalle de ventas',
  ventas_comida: 'Ventas de comida',
  ventas_variantes: 'Ventas de variantes',
  productos: 'Productos',
  variantes_producto: 'Variantes de producto',
  tallas_vasos: 'Vasos físicos',
  motivos_novedad: 'Motivos de novedad',
  medios_transferencia: 'Medios de transferencia',
  usuarios: 'Usuarios',
  configuracion_negocio: 'Configuración',
  uso_almacenamiento_historial: 'Historial de almacenamiento',
}

export function nombreTabla(tabla: string) {
  return NOMBRES_TABLA[tabla] ?? tabla
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`
}

export function porcentajeUso(bytes: number, limite = LIMITE_BD_BYTES) {
  return Math.min(100, (bytes / limite) * 100)
}

export type NivelUso = 'normal' | 'aviso' | 'critico'

export function nivelUso(bytes: number, limite = LIMITE_BD_BYTES): NivelUso {
  const fraccion = bytes / limite
  if (fraccion >= UMBRAL_CRITICO) return 'critico'
  if (fraccion >= UMBRAL_AVISO) return 'aviso'
  return 'normal'
}

function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

/**
 * Crecimiento promedio por día (bytes) entre el primer y el último punto
 * del historial. null si no hay suficiente información (menos de 7 días).
 */
export function crecimientoDiario(historial: PuntoUso[]): number | null {
  if (historial.length < 2) return null
  const orden = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const primero = orden[0]
  const ultimo = orden[orden.length - 1]
  const dias = diasEntre(primero.fecha, ultimo.fecha)
  if (dias < 7) return null
  return Math.max(0, (ultimo.bytes - primero.bytes) / dias)
}

/** Días estimados hasta llenar el plan gratuito al ritmo actual (null = no estimable) */
export function diasHastaLlenar(
  bytesActuales: number,
  porDia: number | null,
  limite = LIMITE_BD_BYTES
): number | null {
  if (porDia === null || porDia <= 0) return null
  return Math.max(0, Math.floor((limite - bytesActuales) / porDia))
}
