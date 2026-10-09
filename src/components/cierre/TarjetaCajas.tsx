'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckAnimado } from '@/components/ui/CheckAnimado'
import { formatCajas, juntarCajas, separarCajas } from '@/lib/cajas'

function parsear(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  return Math.max(0, Math.floor(Number(t)) || 0)
}

/** Dos casillas (cajas + unidades) que juntas dan un total en unidades */
function CampoCajas({
  etiqueta,
  total,
  porCaja,
  disabled,
  resaltar,
  onChange,
}: {
  etiqueta: string
  total: number | null
  porCaja: number
  disabled?: boolean
  resaltar?: boolean
  onChange: (total: number | null) => void
}) {
  const inicial = total === null ? null : separarCajas(total, porCaja)
  const [cajas, setCajas] = useState<number | null>(inicial?.cajas ?? null)
  const [unidades, setUnidades] = useState<number | null>(inicial?.unidades ?? null)

  function cambiar(c: number | null, u: number | null) {
    setCajas(c)
    setUnidades(u)
    onChange(c === null && u === null ? null : juntarCajas(c ?? 0, u ?? 0, porCaja))
  }

  const clase = [
    'text-text-primary h-12 w-full min-w-0 rounded-[12px] border text-center text-xl font-extrabold tabular-nums outline-none transition-[border-color,box-shadow] focus:ring-4 disabled:opacity-60',
    resaltar
      ? 'border-brand/60 bg-brand-soft/40 focus:border-brand focus:ring-brand/15 border-2 border-dashed'
      : 'border-bg-border bg-bg-surface focus:border-brand focus:ring-brand/15',
  ].join(' ')

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend
        className={`mb-1.5 text-xs font-bold ${resaltar ? 'text-brand-strong' : 'text-text-secondary'}`}
      >
        {etiqueta}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['Cajas', cajas, (n: number | null) => cambiar(n, unidades)],
            ['Unidades', unidades, (n: number | null) => cambiar(cajas, n)],
          ] as const
        ).map(([nombre, valor, set]) => (
          <label key={nombre} className="flex min-w-0 flex-col gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              data-conteo
              aria-label={`${etiqueta}: ${nombre.toLowerCase()}`}
              value={valor ?? ''}
              placeholder={resaltar ? '?' : '0'}
              disabled={disabled}
              onChange={(e) => set(parsear(e.target.value))}
              onFocus={(e) => e.currentTarget.select()}
              className={clase}
            />
            <span className="text-text-muted text-center text-[11px] font-bold">{nombre}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Conteo por cajas + unidades (ej. barquillos, 24 por caja):
 * Inicio · Llegaron · Quedan · Usados. Se guarda en unidades.
 */
export function TarjetaCajas({
  titulo,
  porCaja,
  inicio,
  nuevos,
  final,
  disabled,
  onNuevos,
  onFinal,
}: {
  titulo: string
  porCaja: number
  inicio: number
  nuevos: number | null
  final: number | null
  disabled?: boolean
  onNuevos: (n: number | null) => void
  onFinal: (n: number | null) => void
}) {
  const disponible = inicio + (nuevos ?? 0)
  const sinContar = final === null
  const exceso = final !== null && final > disponible
  const usados = final === null ? 0 : Math.max(0, disponible - final)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'bg-bg-surface shadow-soft flex flex-col gap-4 rounded-[var(--radius-lg)] border p-4 sm:p-5',
        exceso ? 'border-bad/50' : sinContar ? 'border-brand/25' : 'border-bg-border',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-40">
          <p className="font-display text-text-primary text-lg leading-tight font-bold">{titulo}</p>
          <p className="text-text-secondary mt-0.5 text-[13px] font-semibold">
            Caja de {porCaja} unidades
          </p>
        </div>
        {exceso ? (
          <span className="badge-bad">Revisar</span>
        ) : sinContar ? (
          <span className="badge-brand">Falta contar</span>
        ) : (
          <CheckAnimado />
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-bold">Inicio</span>
          <span className="bg-bg-elevated text-text-secondary flex h-12 items-center justify-center rounded-[12px] px-2 text-center text-base font-extrabold tabular-nums">
            {formatCajas(inicio, porCaja)}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-bold">Usados</span>
          <motion.span
            key={`${usados}-${exceso}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`flex h-12 items-center justify-center rounded-[12px] px-2 text-center text-base font-extrabold tabular-nums ${
              exceso ? 'bg-bad-soft text-bad' : 'bg-bg-elevated text-text-secondary'
            }`}
          >
            {sinContar ? '—' : exceso ? '!' : `${usados} und`}
          </motion.span>
        </div>
        <CampoCajas
          etiqueta="Llegaron"
          total={nuevos}
          porCaja={porCaja}
          disabled={disabled}
          onChange={onNuevos}
        />
        <CampoCajas
          etiqueta="Quedan"
          total={final}
          porCaja={porCaja}
          disabled={disabled}
          resaltar={sinContar}
          onChange={onFinal}
        />
      </div>

      {exceso && (
        <p className="text-bad -mt-1 text-xs font-bold">
          Quedan {formatCajas(final, porCaja)} y solo había {formatCajas(disponible, porCaja)}.
        </p>
      )}
    </motion.li>
  )
}
