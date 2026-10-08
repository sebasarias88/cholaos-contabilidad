import type { HTMLAttributes } from 'react'

type BadgeVariant = 'admin' | 'empleado' | 'activo' | 'inactivo'

const variants: Record<BadgeVariant, string> = {
  admin: 'badge-brand',
  empleado:
    'bg-bg-elevated text-text-secondary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
  activo: 'badge-green',
  inactivo: 'badge-bad',
}

export function Badge({
  variant = 'empleado',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span className={[variants[variant], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}
