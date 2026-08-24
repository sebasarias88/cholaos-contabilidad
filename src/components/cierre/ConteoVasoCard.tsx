'use client'

import type { NovedadVasoInput } from '@/types'

export type ConteoVasoValor = {
  cantidad_inicio: number
  /** null = sin registrar (en petición va como 0) */
  cantidad_nuevos: number | null
  /** null = sin registrar; sin final no hay vasos gastados */
  cantidad_final: number | null
  novedades: NovedadVasoInput[]
}
