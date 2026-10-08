'use client'

import { motion } from 'framer-motion'

/** Fila de pastillas; la activa se desliza con animación */
export function PildorasFiltro<T extends string>({
  opciones,
  valor,
  onChange,
  id,
  etiqueta,
}: {
  opciones: { id: T; label: string }[]
  valor: T
  onChange: (id: T) => void
  /** Único por pantalla (para la animación) */
  id: string
  etiqueta: string
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
      <div role="group" aria-label={etiqueta} className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {opciones.map((o) => {
          const activa = valor === o.id
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={activa}
              onClick={() => onChange(o.id)}
              className={`focus-ring relative min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors ${
                activa
                  ? 'text-cocoa-text border-transparent'
                  : 'border-bg-border bg-bg-surface text-text-secondary hover:border-brand/40 hover:text-text-primary'
              }`}
            >
              {activa && (
                <motion.span
                  layoutId={`pildora-${id}`}
                  className="bg-cocoa absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
