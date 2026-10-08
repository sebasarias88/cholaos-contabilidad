'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { IdPaso, Paso } from '@/lib/cierre/pasos'

const TONO = {
  completo: 'text-ok',
  parcial: 'text-warn',
  pendiente: 'text-text-secondary',
  neutral: 'text-text-secondary',
}

/** Pasos del cierre: se puede saltar a cualquiera */
export function PasosCierre({
  pasos,
  actual,
  onCambiar,
}: {
  pasos: Paso[]
  actual: IdPaso
  onCambiar: (id: IdPaso) => void
}) {
  const indiceActual = pasos.findIndex((p) => p.id === actual)

  return (
    <nav aria-label="Pasos del cierre" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ol
        className="flex min-w-max gap-2 sm:grid sm:min-w-0"
        style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}
      >
        {pasos.map((paso, i) => {
          const activo = paso.id === actual
          return (
            <li key={paso.id} className="relative">
              <button
                type="button"
                onClick={() => onCambiar(paso.id)}
                aria-current={activo ? 'step' : undefined}
                className={[
                  'focus-ring bg-bg-surface relative flex w-full min-w-[150px] items-center gap-3 rounded-[16px] border px-3 py-2.5 text-left transition-colors',
                  activo ? 'border-transparent' : 'border-bg-border hover:border-brand/30',
                ].join(' ')}
              >
                {activo && (
                  <motion.span
                    layoutId="paso-activo"
                    className="border-brand absolute inset-0 rounded-[16px] border-2"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  />
                )}
                <span
                  className={[
                    'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors',
                    activo
                      ? 'bg-brand text-white'
                      : paso.estado === 'completo'
                        ? 'bg-ok-soft text-ok'
                        : 'bg-bg-elevated text-text-secondary',
                  ].join(' ')}
                >
                  {paso.estado === 'completo' && !activo ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="relative min-w-0">
                  <span className="text-text-primary block text-[15px] font-extrabold">
                    {paso.titulo}
                  </span>
                  <span className={`block truncate text-xs font-bold ${TONO[paso.estado]}`}>
                    {paso.detalle}
                  </span>
                </span>
              </button>
              {i < indiceActual && <span className="sr-only">(anterior)</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
