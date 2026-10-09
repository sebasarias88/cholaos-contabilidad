'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CheckAnimado } from '@/components/ui/CheckAnimado'

/** Enter salta a la siguiente casilla del conteo (rápido en computador) */
function saltarConEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key !== 'Enter') return
  e.preventDefault()
  const campos = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[data-conteo]:not(:disabled)')
  )
  const i = campos.indexOf(e.currentTarget)
  const siguiente = campos[i + 1]
  if (siguiente) {
    siguiente.focus()
    siguiente.select()
  } else {
    e.currentTarget.blur()
  }
}

function parsear(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  return Math.max(0, Math.floor(Number(t)) || 0)
}

export function CampoNumero({
  etiqueta,
  valor,
  onChange,
  disabled,
  resaltar,
}: {
  etiqueta: string
  valor: number | null
  onChange: (n: number | null) => void
  disabled?: boolean
  resaltar?: boolean
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span
        className={`text-xs font-bold ${resaltar ? 'text-brand-strong' : 'text-text-secondary'}`}
      >
        {etiqueta}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        data-conteo
        value={valor ?? ''}
        placeholder={resaltar ? '?' : '0'}
        disabled={disabled}
        onChange={(e) => onChange(parsear(e.target.value))}
        onKeyDown={saltarConEnter}
        onFocus={(e) => e.currentTarget.select()}
        className={[
          'text-text-primary h-12 w-full min-w-0 rounded-[12px] border text-center text-xl font-extrabold tabular-nums transition-[border-color,box-shadow] outline-none focus:ring-4 disabled:opacity-60',
          resaltar
            ? 'border-brand/60 bg-brand-soft/40 focus:border-brand focus:ring-brand/15 border-2 border-dashed'
            : 'border-bg-border bg-bg-surface focus:border-brand focus:ring-brand/15',
        ].join(' ')}
      />
    </label>
  )
}

/** Tarjeta de conteo: Inicio · Llegaron · Quedan · Resultado */
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
  tonoResultado,
  ancho = false,
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
  tonoResultado: 'ok' | 'bad' | 'neutral'
  ancho?: boolean
  onNuevos: (n: number | null) => void
  onFinal: (n: number | null) => void
  children?: ReactNode
}) {
  const sinContar = final === null
  // Quedan más de las que había: dato imposible, se marca en la tarjeta
  const exceso = final !== null && final > inicio + (nuevos ?? 0)
  const tono = {
    ok: 'bg-ok-soft text-ok',
    bad: 'bg-bad-soft text-bad',
    neutral: 'bg-bg-elevated text-text-secondary',
  }[exceso ? 'bad' : tonoResultado]

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'bg-bg-surface shadow-soft flex flex-col gap-4 rounded-[var(--radius-lg)] border p-4 sm:p-5',
        exceso ? 'border-bad/50' : sinContar ? 'border-brand/25' : 'border-bg-border',
        ancho ? 'md:col-span-2' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-text-primary text-lg leading-tight font-bold">{titulo}</p>
          {subtitulo && (
            <p className="text-text-secondary mt-0.5 text-[13px] font-semibold">{subtitulo}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {accion}
          {exceso ? (
            <span className="badge-bad">Revisar</span>
          ) : sinContar ? (
            <span className="badge-brand">Falta contar</span>
          ) : (
            <CheckAnimado />
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-bold">Inicio</span>
          <span className="bg-bg-elevated text-text-secondary flex h-12 items-center justify-center rounded-[12px] text-xl font-extrabold tabular-nums">
            {inicio}
          </span>
        </div>
        <CampoNumero etiqueta="Llegaron" valor={nuevos} onChange={onNuevos} disabled={disabled} />
        <CampoNumero
          etiqueta="Quedan"
          valor={final}
          onChange={onFinal}
          disabled={disabled}
          resaltar={sinContar}
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-bold">{etiquetaResultado}</span>
          <motion.span
            key={`${resultado}-${tonoResultado}`}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className={`flex h-12 items-center justify-center rounded-[12px] text-xl font-extrabold tabular-nums ${tono}`}
          >
            {sinContar ? '—' : exceso ? '!' : resultado}
          </motion.span>
        </div>
      </div>

      {exceso && (
        <p className="text-bad -mt-1 text-xs font-bold">
          Quedan {final} y solo había {inicio + (nuevos ?? 0)}. Revisa el conteo.
        </p>
      )}

      {children}
    </motion.li>
  )
}
