'use client'

import type { InputHTMLAttributes } from 'react'

const cellBase =
  'h-7 w-full min-w-[3.25rem] rounded border px-1 text-center text-sm font-semibold tabular-nums outline-none transition-colors'

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
          ? 'cursor-default border-bg-border/60 bg-bg-elevated text-text-secondary'
          : 'border-bg-border bg-bg-surface text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30',
        disabled ? 'opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

export function displayCantidad(n: number | null, editable: boolean) {
  if (editable && n === null) return ''
  return n ?? 0
}

export function parseCantidad(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  return Math.max(0, Number(trimmed) || 0)
}

export function TablaConteoShell({
  columns,
  children,
}: {
  columns: { key: string; label: string; className?: string }[]
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-bg-border">
      <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-bg-border bg-bg-elevated/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary',
                  col.className,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
