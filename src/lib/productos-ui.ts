import type { TipoProducto } from '@/types'

export const TIPOS_PRODUCTO = [
  {
    value: 'vaso' as const,
    label: 'Vaso',
    emoji: '🥤',
    desc: 'Cholao, Raspao, Lulada...',
  },
  {
    value: 'comida' as const,
    label: 'Comida',
    emoji: '🍕',
    desc: 'Pizza, Gaseosa, Pizzeta...',
  },
  {
    value: 'insumo' as const,
    label: 'Insumo',
    emoji: '🧂',
    desc: 'Barquillo, Masa, ingrediente...',
  },
]

export const BADGE_TIPO: Record<TipoProducto, { label: string; className: string }> = {
  vaso: {
    label: '🥤 Vaso',
    className: 'bg-brand-soft text-brand',
  },
  comida: {
    label: '🍕 Comida',
    className: 'bg-ok-soft text-ok',
  },
  insumo: {
    label: '🧂 Insumo',
    className: 'border border-bg-border bg-bg-elevated text-text-secondary',
  },
}

/** Etiqueta de medida: onzas para vaso, unidad para comida/insumo */
export function medidaProducto(p: {
  tipo?: TipoProducto | string | null
  onzas?: number | null
  unidad?: string | null
  talla?: { onzas: number; tipo?: string; descripcion?: string | null } | null
}): string {
  const tipo = (p.tipo as TipoProducto | undefined) ?? 'vaso'
  if (tipo === 'vaso') {
    if (p.talla) {
      const desc = p.talla.descripcion?.trim()
      if (desc) return desc
      const oz = p.talla.onzas
      const tv = p.talla.tipo
      if (tv && tv !== 'normal') return `${oz} oz (${tv})`
      return `${oz} oz`
    }
    return p.onzas != null ? `${p.onzas} oz` : '—'
  }
  return p.unidad?.trim() || '—'
}

export function tipoProducto(p: { tipo?: TipoProducto | string | null }): TipoProducto {
  if (p.tipo === 'comida' || p.tipo === 'insumo' || p.tipo === 'vaso') {
    return p.tipo
  }
  return 'vaso'
}
