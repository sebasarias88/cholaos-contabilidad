import type { MotivoNovedad } from '@/types'

/** Los primeros 5 por orden son predefinidos (no se desactivan ni renombran). */
export const MOTIVOS_PREDEFINIDOS_MAX_ORDEN = 5

export function esMotivoPredefinido(m: Pick<MotivoNovedad, 'orden'>): boolean {
  return m.orden <= MOTIVOS_PREDEFINIDOS_MAX_ORDEN
}
