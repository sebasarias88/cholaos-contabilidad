import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { Card } from '@/components/ui/Card'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: React.ReactNode
  subtitle?: string
  icon?: LucideIcon
  iconClassName?: string
  trend?: number
  glow?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName = 'text-accent-cyan',
  trend,
  glow = false,
  className,
  ...props
}: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0

  return (
    <Card glow={glow} hover className={className} {...props}>
      <div className="relative">
        {Icon && (
          <Icon
            size={22}
            className={`absolute right-0 top-0 ${iconClassName}`}
            aria-hidden
          />
        )}
        <p className="pr-8 text-sm font-medium text-text-secondary">{title}</p>
        <p className="font-display mt-2 text-2xl font-bold text-text-primary">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
        )}
        {trend !== undefined && (
          <span
            className={[
              'mt-2 inline-flex rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium',
              trendUp
                ? 'bg-accent-green-dim text-accent-green'
                : 'bg-accent-red-dim text-accent-red',
            ].join(' ')}
          >
            {trendUp ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </Card>
  )
}
