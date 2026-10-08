import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ className, label, error, hint, id, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-text-primary text-sm font-bold">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={[
          'input w-full',
          error && 'border-bad focus:border-bad focus:ring-bad/15',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-bad text-xs font-semibold">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-text-secondary text-xs">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
