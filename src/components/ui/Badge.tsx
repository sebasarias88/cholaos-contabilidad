import type { HTMLAttributes } from 'react'

type BadgeVariant = 'dueno' | 'empleado' | 'activo' | 'inactivo'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  dueno: 'bg-accent-cyan-dim text-accent-cyan',
  empleado: 'bg-bg-elevated text-text-secondary',
  activo: 'bg-accent-green-dim text-accent-green',
  inactivo: 'bg-accent-red-dim text-accent-red',
}

export function Badge({
  variant = 'empleado',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
