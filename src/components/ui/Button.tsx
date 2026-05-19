'use client'

import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-cyan text-bg-base shadow-glow-cyan hover:brightness-110 font-medium',
  secondary:
    'border border-bg-border bg-transparent text-text-primary hover:bg-bg-elevated',
  ghost: 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
  danger:
    'bg-accent-red-dim text-accent-red border border-accent-red/30 hover:bg-accent-red/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={[
        'focus-ring-cyan inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-md)] transition-surface disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <motion.span
          className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
}
