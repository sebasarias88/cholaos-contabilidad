'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { IdPaso, Paso } from '@/lib/cierre/pasos'

const TONO = {
  completo: 'text-ok',
  parcial: 'text-warn',
  pendiente: 'text-text-muted',
  neutral: 'text-text-muted',
}

/**
 * Pasos del cierre como línea de progreso: un círculo por paso y el título debajo.
 * Se reparte en el ancho disponible (no se monta en pantallas angostas) y se puede
 * saltar a cualquier paso.
 */
export function PasosCierre({
  pasos,
  actual,
  onCambiar,
}: {
  pasos: Paso[]
  actual: IdPaso
  onCambiar: (id: IdPaso) => void
}) {
  const n = pasos.length
  const indiceActual = Math.max(
    0,
    pasos.findIndex((p) => p.id === actual)
  )
  // La línea va del centro del primer círculo al centro del último
  const margen = `calc(100% / ${n * 2})`
  const progreso = n > 1 ? indiceActual / (n - 1) : 0

  return (
    <nav aria-label="Pasos del cierre" className="card px-2 py-3 sm:px-4 sm:py-4">
      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        <span
          aria-hidden
          className="bg-bg-border absolute top-[19px] h-1 rounded-full sm:top-[21px]"
          style={{ left: margen, right: margen }}
        />
        <motion.span
          aria-hidden
          className="bg-brand absolute top-[19px] h-1 origin-left rounded-full sm:top-[21px]"
          style={{ left: margen, right: margen }}
          initial={false}
          animate={{ scaleX: progreso }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />

        {pasos.map((paso, i) => {
          const activo = paso.id === actual
          const completo = paso.estado === 'completo'
          return (
            <li key={paso.id} className="relative min-w-0">
              <button
                type="button"
                onClick={() => onCambiar(paso.id)}
                aria-current={activo ? 'step' : undefined}
                className="focus-ring group flex w-full flex-col items-center gap-1.5 rounded-[14px] px-1 pb-1 text-center"
              >
                <span className="relative">
                  {activo && (
                    <motion.span
                      layoutId="paso-activo"
                      className="bg-brand/15 absolute -inset-1.5 rounded-full"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    />
                  )}
                  <span
                    className={[
                      'ring-bg-surface relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ring-4 transition-colors sm:h-11 sm:w-11',
                      activo
                        ? 'bg-brand shadow-brand text-white'
                        : completo
                          ? 'bg-ok-solid text-white'
                          : 'bg-bg-elevated text-text-secondary group-hover:bg-brand-soft group-hover:text-brand',
                    ].join(' ')}
                  >
                    {completo && !activo ? <Check size={18} strokeWidth={3} /> : i + 1}
                  </span>
                </span>
                <span
                  className={`text-[13px] leading-tight font-extrabold sm:text-sm ${
                    activo ? 'text-brand-strong' : 'text-text-primary'
                  }`}
                >
                  {paso.titulo}
                </span>
                <span
                  className={`hidden w-full truncate text-[11px] font-bold sm:block sm:text-xs ${TONO[paso.estado]}`}
                >
                  {paso.detalle}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
