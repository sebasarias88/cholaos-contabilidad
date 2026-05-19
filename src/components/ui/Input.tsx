import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const fieldClass =
  'w-full rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-surface focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20'

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[fieldClass, error && 'border-accent-red focus:ring-accent-red/20 focus:border-accent-red', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-accent-red">
          {error}
        </span>
      )}
    </div>
  )
}
