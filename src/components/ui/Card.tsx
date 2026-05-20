import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  header?: ReactNode
  footer?: ReactNode
  hover?: boolean
  glow?: boolean
  /** Iguala altura en grids: la card ocupa 100% y el cuerpo crece */
  fillHeight?: boolean
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['border-b border-bg-border px-6 py-4', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['px-6 py-4', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['border-t border-bg-border px-6 py-4', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function Card({
  className,
  title,
  description,
  header,
  footer,
  hover = false,
  glow = false,
  fillHeight = false,
  children,
  ...props
}: CardProps) {
  const resolvedHeader =
    header ??
    (title || description ? (
      <>
        {title && (
          <h2 className="font-display text-lg font-semibold text-text-primary">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </>
    ) : null)

  const useCompoundSlots = Boolean(header || footer)

  return (
    <div
      className={[
        'overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface transition-surface',
        hover && 'hover:border-accent-cyan/30',
        glow && 'shadow-glow-cyan',
        fillHeight && 'flex h-full flex-col',
        !useCompoundSlots && !resolvedHeader && 'p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {resolvedHeader && (
        <CardHeader className={!useCompoundSlots ? 'border-b-0 pb-0' : undefined}>
          {resolvedHeader}
        </CardHeader>
      )}
      {useCompoundSlots ? (
        children
      ) : resolvedHeader ? (
        <CardBody
          className={
            fillHeight
              ? 'flex flex-1 flex-col pt-4'
              : 'pt-4'
          }
        >
          {children}
        </CardBody>
      ) : (
        children
      )}
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  )
}
