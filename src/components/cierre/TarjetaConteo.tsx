'use client'

import type { ReactNode } from 'react'
import { CeldaNumero, displayCantidad, parseCantidad } from '@/components/cierre/ConteoTabla'

/** Tarjeta con Inicio / +Nuevos / Final y el resultado (vasos e insumos) */
export function TarjetaConteo({
  titulo,
  subtitulo,
  accion,
  inicio,
  nuevos,
  final,
  disabled,
  etiquetaResultado,
  resultado,
  claseResultado,
  onNuevos,
  onFinal,
  children,
}: {
  titulo: string
  subtitulo?: string
  accion?: ReactNode
  inicio: number
  nuevos: number | null
  final: number | null
  disabled?: boolean
  etiquetaResultado: string
  resultado: number
  claseResultado: string
  onNuevos: (n: number | null) => void
  onFinal: (n: number | null) => void
  children?: ReactNode
}) {
  return (
    <li className="border-bg-border bg-bg-surface rounded-[var(--radius-md)] border p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-text-primary text-sm font-semibold">{titulo}</p>
          {subtitulo && <p className="text-text-muted mt-0.5 text-[11px]">{subtitulo}</p>}
        </div>
        {accion}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Campo label="Inicio">
          <CeldaNumero
            readonly
            value={inicio}
            disabled={disabled}
            className="h-9 min-w-0 text-sm"
          />
        </Campo>
        <Campo label="+Nuevos">
          <CeldaNumero
            value={displayCantidad(nuevos)}
            placeholder="0"
            disabled={disabled}
            className="h-9 min-w-0 text-sm"
            onChange={(e) => onNuevos(parseCantidad(e.target.value))}
          />
        </Campo>
        <Campo label="Final">
          <CeldaNumero
            value={displayCantidad(final)}
            placeholder="—"
            disabled={disabled}
            className="h-9 min-w-0 text-sm"
            onChange={(e) => onFinal(parseCantidad(e.target.value))}
          />
        </Campo>
        <Campo label={etiquetaResultado}>
          <span
            className={`flex h-9 items-center justify-center rounded border border-transparent text-sm font-semibold tabular-nums ${claseResultado}`}
          >
            {resultado}
          </span>
        </Campo>
      </div>

      {children}
    </li>
  )
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-text-secondary text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
