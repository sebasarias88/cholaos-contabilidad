'use client'

import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

/** Contador − n + grande y táctil */
export function Stepper({
  valor,
  onChange,
  min = 0,
  disabled = false,
  etiqueta,
  tamano = 'md',
}: {
  valor: number
  onChange: (n: number) => void
  min?: number
  disabled?: boolean
  etiqueta: string
  tamano?: 'sm' | 'md'
}) {
  const boton = tamano === 'sm' ? 'h-9 w-9 rounded-[10px]' : 'h-11 w-11 rounded-[12px]'
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={etiqueta}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        aria-label={`Menos ${etiqueta}`}
        disabled={disabled || valor <= min}
        onClick={() => onChange(Math.max(min, valor - 1))}
        className={`focus-ring border-bg-border bg-bg-surface text-text-primary hover:bg-bg-elevated flex ${boton} items-center justify-center border transition-colors disabled:opacity-35`}
      >
        <Minus size={16} strokeWidth={2.6} />
      </motion.button>
      <motion.span
        key={valor}
        initial={{ scale: 1.25, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-text-primary min-w-8 text-center font-extrabold tabular-nums ${tamano === 'sm' ? 'text-base' : 'text-lg'}`}
        aria-live="polite"
      >
        {valor}
      </motion.span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        aria-label={`Más ${etiqueta}`}
        disabled={disabled}
        onClick={() => onChange(valor + 1)}
        className={`focus-ring bg-brand hover:bg-brand-strong flex ${boton} items-center justify-center text-white transition-colors disabled:opacity-35`}
      >
        <Plus size={16} strokeWidth={2.6} />
      </motion.button>
    </div>
  )
}
