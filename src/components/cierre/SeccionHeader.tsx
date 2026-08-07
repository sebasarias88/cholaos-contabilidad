'use client'

import { formatPesos } from '@/lib/utils'

interface SeccionHeaderProps {
  emoji: string
  titulo: string
  cantidad: number
  totalVendido?: number
  esAdmin: boolean
}

export function SeccionHeader({
  emoji,
  titulo,
  cantidad,
  totalVendido,
  esAdmin,
}: SeccionHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-lg" aria-hidden>
          {emoji}
        </span>
        <h3 className="font-display text-base font-semibold text-text-primary">
          {titulo}
        </h3>
        <span className="shrink-0 rounded-full bg-bg-elevated px-2 py-0.5 text-xs font-medium text-text-secondary tabular-nums">
          {cantidad}
        </span>
      </div>
      {esAdmin && totalVendido !== undefined && totalVendido > 0 && (
        <span className="shrink-0 text-sm font-semibold text-text-primary tabular-nums">
          {formatPesos(totalVendido)}
        </span>
      )}
    </div>
  )
}
