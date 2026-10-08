import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: ReactNode
  hover?: boolean
  /** Iguala altura en grids */
  fillHeight?: boolean
  padding?: boolean
}

export function Card({
  className,
  title,
  description,
  action,
  hover = false,
  fillHeight = false,
  padding = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        hover ? 'card-hover' : 'card',
        fillHeight && 'flex h-full flex-col',
        padding && 'p-5 sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-text-primary text-lg font-bold">{title}</h2>}
            {description && <p className="text-text-secondary mt-0.5 text-sm">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={fillHeight ? 'flex min-h-0 flex-1 flex-col' : undefined}>{children}</div>
    </div>
  )
}
