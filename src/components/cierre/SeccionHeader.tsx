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
        <h3 className="font-display text-text-primary text-base font-semibold">{titulo}</h3>
        <span className="bg-bg-elevated text-text-secondary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {cantidad}
        </span>
      </div>
      {esAdmin && totalVendido !== undefined && totalVendido > 0 && (
        <span className="text-text-primary shrink-0 text-sm font-semibold tabular-nums">
          {formatPesos(totalVendido)}
        </span>
      )}
    </div>
  )
}
