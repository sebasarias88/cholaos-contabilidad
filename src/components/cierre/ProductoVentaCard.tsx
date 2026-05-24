'use client'

import { formatPesos } from '@/lib/utils'
import type { Producto } from '@/types'

interface ProductoVentaCardProps {
  producto: Producto
  cantidad: number
  disabled?: boolean
  esAdmin: boolean
  compact?: boolean
  onChange: (cantidad: number) => void
}

export function ProductoVentaCard({
  producto,
  cantidad,
  disabled = false,
  esAdmin,
  compact = false,
  onChange,
}: ProductoVentaCardProps) {
  const activo = cantidad > 0
  const label = `${producto.nombre} ${producto.onzas}oz`

  return (
    <div
      className={[
        'card transition-colors duration-150',
        compact ? 'p-2.5' : 'p-4',
        activo ? 'border-accent-cyan/40 shadow-glow-cyan' : '',
      ].join(' ')}
    >
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        <div>
          <p className="text-sm font-medium leading-tight text-text-primary capitalize">
            {producto.nombre}
          </p>
          <p className="text-xs text-text-muted">{producto.onzas} oz</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={disabled}
            aria-label={`Menos ${label}`}
            onClick={() => onChange(Math.max(0, cantidad - 1))}
            className={[
              'flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary transition-colors hover:bg-bg-border disabled:opacity-40',
              compact ? 'h-7 w-7 text-sm' : 'h-8 w-8',
            ].join(' ')}
          >
            −
          </button>
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={cantidad}
            aria-label={`Cantidad ${label}`}
            onChange={(e) =>
              onChange(Math.max(0, Number(e.target.value) || 0))
            }
            className={[
              'w-10 border-0 bg-transparent text-center font-medium tabular-nums text-text-primary focus:outline-none focus:ring-0 disabled:opacity-40',
              compact ? 'text-base' : 'w-12 text-lg',
            ].join(' ')}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={`Más ${label}`}
            onClick={() => onChange(cantidad + 1)}
            className={[
              'flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-accent-cyan transition-colors hover:bg-accent-cyan-dim disabled:opacity-40',
              compact ? 'h-7 w-7 text-sm' : 'h-8 w-8',
            ].join(' ')}
          >
            +
          </button>
        </div>

        {esAdmin && activo && (
          <p className="text-center text-xs text-text-muted tabular-nums">
            {formatPesos(cantidad * producto.precio)}
          </p>
        )}
      </div>
    </div>
  )
}
