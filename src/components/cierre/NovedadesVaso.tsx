'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react'
import type { MotivoNovedad, NovedadVasoInput } from '@/types'

interface NovedadesVasoProps {
  novedades: NovedadVasoInput[]
  motivos: MotivoNovedad[]
  disabled?: boolean
  onChange: (novedades: NovedadVasoInput[]) => void
}

const CONTROL_H = 'h-9'

function StepperCantidad({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled?: boolean
  onChange: (n: number) => void
}) {
  return (
    <div
      role="group"
      aria-label="Cantidad"
      className={[
        'inline-flex items-center overflow-hidden rounded-[var(--radius-md)] border border-bg-border bg-bg-surface',
        CONTROL_H,
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <button
        type="button"
        disabled={disabled || value <= 1}
        aria-label="Menos uno"
        onClick={() => onChange(Math.max(1, value - 1))}
        className={`flex w-8 ${CONTROL_H} items-center justify-center text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Minus size={13} aria-hidden />
      </button>
      <span className="min-w-[1.5rem] select-none px-0.5 text-center text-xs font-semibold tabular-nums text-text-primary">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-label="Más uno"
        onClick={() => onChange(value + 1)}
        className={`flex w-8 ${CONTROL_H} items-center justify-center text-accent-cyan transition-colors hover:bg-accent-cyan-dim disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Plus size={13} aria-hidden />
      </button>
    </div>
  )
}


export function NovedadesVaso({
  novedades,
  motivos,
  disabled = false,
  onChange,
}: NovedadesVasoProps) {
  const totalNovedades = novedades.reduce((s, n) => s + n.cantidad, 0)
  const motivoOtro = motivos.find((m) => m.descripcion === 'Otro')

  function agregar() {
    const primerMotivo = motivos[0]?.id
    if (!primerMotivo) return
    onChange([...novedades, { motivo_id: primerMotivo, cantidad: 1 }])
  }

  function actualizar<K extends keyof NovedadVasoInput>(
    index: number,
    campo: K,
    valor: NovedadVasoInput[K]
  ) {
    const nuevas = [...novedades]
    nuevas[index] = { ...nuevas[index], [campo]: valor }
    if (campo === 'motivo_id' && valor !== motivoOtro?.id) {
      nuevas[index].motivo_custom = undefined
    }
    onChange(nuevas)
  }

  function eliminar(index: number) {
    onChange(novedades.filter((_, i) => i !== index))
  }

  if (motivos.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        No hay motivos de novedad configurados.
      </p>
    )
  }

  const fieldClass = [
    'select-field !h-9 !py-0 w-full min-w-0 rounded-[var(--radius-md)] text-xs leading-none text-text-primary',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <AlertTriangle size={13} className="shrink-0 text-accent-amber" aria-hidden />
          <span className="text-xs font-medium text-text-secondary">
            Vasos no vendidos
          </span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={agregar}
            className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-dashed border-bg-border px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:border-accent-amber/50 hover:text-accent-amber"
          >
            <Plus size={11} aria-hidden />
            Agregar
          </button>
        )}
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {novedades.length === 0 ? (
          <motion.p
            key="vacio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[var(--radius-md)] border border-dashed border-bg-border/80 px-3 py-2 text-center text-[11px] text-text-muted"
          >
            Sin novedades
          </motion.p>
        ) : (
          novedades.map((novedad, i) => {
            const esOtro = novedad.motivo_id === motivoOtro?.id
            const motivoActual = motivos.find((m) => m.id === novedad.motivo_id)

            return (
              <motion.div
                key={`${novedad.motivo_id}-${i}`}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="space-y-1.5 rounded-[var(--radius-md)] border border-bg-border/80 bg-bg-surface/80 p-2"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="relative w-[14rem] shrink-0">
                    <span
                      className="pointer-events-none absolute left-2 top-1/2 z-[1] -translate-y-1/2 text-sm leading-none"
                      aria-hidden
                    >
                      {motivoActual?.emoji ?? '⚪'}
                    </span>
                    <select
                      value={novedad.motivo_id}
                      disabled={disabled}
                      aria-label="Motivo de novedad"
                      onChange={(e) =>
                        actualizar(i, 'motivo_id', e.target.value)
                      }
                      className={`${fieldClass} !pl-7 !pr-6`}
                    >
                      {motivos.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <StepperCantidad
                    value={novedad.cantidad}
                    disabled={disabled}
                    onChange={(n) => actualizar(i, 'cantidad', n)}
                  />

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => eliminar(i)}
                      aria-label="Quitar novedad"
                      className={`flex ${CONTROL_H} w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-muted transition-colors hover:bg-accent-red-dim hover:text-accent-red`}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  )}
                </div>

                {esOtro && (
                  <input
                    type="text"
                    disabled={disabled}
                    value={novedad.motivo_custom ?? ''}
                    onChange={(e) =>
                      actualizar(i, 'motivo_custom', e.target.value)
                    }
                    placeholder="Describe el motivo..."
                    className={`${fieldClass} max-w-[14rem] px-2.5`}
                  />
                )}
              </motion.div>
            )
          })
        )}
      </AnimatePresence>

      {totalNovedades > 0 && (
        <p className="flex items-center justify-end gap-1 text-[11px] text-accent-amber">
          <AlertTriangle size={11} aria-hidden />
          <span className="tabular-nums font-medium">
            {totalNovedades} descontado{totalNovedades !== 1 ? 's' : ''}
          </span>
        </p>
      )}
    </div>
  )
}
