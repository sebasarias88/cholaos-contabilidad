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

function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['border-bg-border border-b px-4 py-3 sm:px-6 sm:py-4', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['px-4 py-3 sm:px-6 sm:py-4', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['border-bg-border border-t px-4 py-3 sm:px-6 sm:py-4', className]
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
          <h2 className="font-display text-text-primary text-base font-semibold sm:text-lg">
            {title}
          </h2>
        )}
        {description && <p className="text-text-secondary mt-1 text-sm">{description}</p>}
      </>
    ) : null)

  const useCompoundSlots = Boolean(header || footer)

  return (
    <div
      className={[
        'border-bg-border bg-bg-surface transition-surface overflow-hidden rounded-[var(--radius-lg)] border',
        hover && 'hover:border-accent-cyan/30',
        glow && 'shadow-glow-cyan',
        fillHeight && 'flex h-full flex-col',
        !useCompoundSlots && !resolvedHeader && 'p-4 sm:p-6',
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
        <CardBody className={fillHeight ? 'flex flex-1 flex-col pt-4' : 'pt-4'}>
          {children}
        </CardBody>
      ) : (
        children
      )}
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  )
}
