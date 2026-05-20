'use client'

import { Minus, Plus } from 'lucide-react'

interface CantidadStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  size?: 'sm' | 'md'
  'aria-label'?: string
}

export function CantidadStepper({
  value,
  onChange,
  min = 0,
  size = 'md',
  'aria-label': ariaLabel,
}: CantidadStepperProps) {
  const btnClass =
    size === 'sm'
      ? 'flex h-9 w-9 items-center justify-center'
      : 'flex h-11 w-11 items-center justify-center'

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated"
    >
      <button
        type="button"
        aria-label="Disminuir cantidad"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${btnClass} rounded-l-[var(--radius-md)] text-text-secondary transition-surface hover:bg-bg-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30`}
      >
        <Minus size={size === 'sm' ? 16 : 18} aria-hidden />
      </button>
      <span
        className={[
          'min-w-[2.75rem] select-none text-center font-semibold tabular-nums text-text-primary',
          size === 'sm' ? 'text-base' : 'text-lg',
        ].join(' ')}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        onClick={() => onChange(value + 1)}
        className={`${btnClass} rounded-r-[var(--radius-md)] text-accent-cyan transition-surface hover:bg-accent-cyan-dim`}
      >
        <Plus size={size === 'sm' ? 16 : 18} aria-hidden />
      </button>
    </div>
  )
}
