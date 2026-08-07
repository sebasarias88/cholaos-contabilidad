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

export const BADGE_TIPO: Record<
  TipoProducto,
  { label: string; className: string }
> = {
  vaso: {
    label: '🥤 Vaso',
    className: 'bg-accent-cyan-dim text-accent-cyan',
  },
  comida: {
    label: '🍕 Comida',
    className: 'bg-accent-green-dim text-accent-green',
  },
  insumo: {
    label: '🧂 Insumo',
    className: 'bg-bg-elevated text-text-muted',
  },
}

/** Etiqueta de medida: onzas para vaso, unidad para comida/insumo */
export function medidaProducto(p: {
  tipo?: TipoProducto | string | null
  onzas?: number | null
  unidad?: string | null
}): string {
  const tipo = (p.tipo as TipoProducto | undefined) ?? 'vaso'
  if (tipo === 'vaso') {
    return p.onzas != null ? `${p.onzas} oz` : '—'
  }
  return p.unidad?.trim() || '—'
}

export function tipoProducto(p: {
  tipo?: TipoProducto | string | null
}): TipoProducto {
  if (p.tipo === 'comida' || p.tipo === 'insumo' || p.tipo === 'vaso') {
    return p.tipo
  }
  return 'vaso'
}
