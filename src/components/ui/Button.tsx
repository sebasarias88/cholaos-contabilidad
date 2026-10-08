'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children?: React.ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-brand hover:bg-brand-strong font-bold',
  secondary:
    'border border-bg-border bg-bg-surface text-text-primary hover:border-brand/40 hover:bg-bg-elevated font-bold',
  ghost: 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary font-semibold',
  danger: 'bg-bad text-white hover:brightness-110 font-bold',
  dark: 'bg-cocoa text-cocoa-text hover:bg-cocoa-2 font-bold',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm gap-1.5 rounded-[10px]',
  md: 'min-h-11 px-4 text-[15px] gap-2 rounded-[var(--radius-md)]',
  lg: 'min-h-13 px-6 text-base gap-2 rounded-[14px]',
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
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      className={[
        'focus-ring transition-surface relative inline-flex items-center justify-center select-none disabled:opacity-50',
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
      {loading && (
        <motion.span
          className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
          aria-hidden
        />
      )}
      {children}
    </motion.button>
  )
}
