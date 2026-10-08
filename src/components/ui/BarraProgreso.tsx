'use client'

import { motion } from 'framer-motion'

const COLORES = {
  brand: 'bg-brand',
  ok: 'bg-ok-solid',
  warn: 'bg-warn-solid',
  bad: 'bg-bad',
}

/** Barra de progreso que se llena con animación */
export function BarraProgreso({
  valor,
  color = 'brand',
  className = 'h-2',
  label,
}: {
  /** 0 a 100 */
  valor: number
  color?: keyof typeof COLORES
  className?: string
  label?: string
}) {
  const pct = Math.max(0, Math.min(100, valor))
  return (
    <div
      className={`bg-bg-elevated overflow-hidden rounded-full ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <motion.div
        className={`h-full rounded-full ${COLORES[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
