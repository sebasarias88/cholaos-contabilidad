'use client'

import type { InputHTMLAttributes } from 'react'

const cellBase =
  'h-7 w-full min-w-[3.25rem] rounded border px-1 text-center text-sm font-semibold tabular-nums outline-none transition-colors'

const celdaCantidadMobileInput = '!h-10 !w-full !min-w-0 px-1 text-sm'

const celdaCantidadDesktopInput = '!h-8 !w-full !min-w-0 px-1 text-sm'

/** Cantidad compacta para filas mobile (evita conflicto con w-full de cellBase) */
export function CeldaCantidadMobile({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { readonly?: boolean }) {
  return (
    <div className="w-16 shrink-0">
      <CeldaNumero
        {...props}
        className={[celdaCantidadMobileInput, className].filter(Boolean).join(' ')}
      />
    </div>
  )
}

/** Cantidad compacta para celdas de tabla desktop */
export function CeldaCantidadDesktop({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { readonly?: boolean }) {
  return (
    <div className="mx-auto w-14">
      <CeldaNumero
        {...props}
        className={[celdaCantidadDesktopInput, className].filter(Boolean).join(' ')}
      />
    </div>
  )
}

export function CeldaNumero({
  readonly,
  className,
  disabled,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { readonly?: boolean }) {
  const isRo = Boolean(readonly || props.readOnly)
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      {...props}
      readOnly={isRo}
      disabled={disabled}
      className={[
        cellBase,
        isRo
          ? 'border-bg-border bg-bg-elevated text-text-secondary cursor-default'
          : 'border-bg-border bg-bg-surface text-text-primary focus:border-accent-cyan focus:ring-accent-cyan/30 focus:ring-1',
        disabled ? 'opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

/** null (sin contar) se muestra vacío */
export function displayCantidad(n: number | null) {
  return n === null ? '' : n
}

export function parseCantidad(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  return Math.max(0, Number(trimmed) || 0)
}
