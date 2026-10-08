'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { formatPesos } from '@/lib/utils'

/** Bloque plegable del resumen de caja */
export function SeccionAcordeon({
  emoji,
  titulo,
  total,
  cantidad,
  colorTotal = 'text-text-primary',
  abierta,
  onToggle,
  children,
}: {
  emoji: string
  titulo: string
  total?: number
  cantidad?: number
  colorTotal?: string
  abierta: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-bg-border overflow-hidden rounded-[var(--radius-md)] border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        className="hover:bg-bg-elevated/50 flex w-full items-center justify-between p-3.5 transition-colors"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden>{emoji}</span>
          <span className="text-text-primary text-sm font-medium">{titulo}</span>
          {!!cantidad && (
            <span className="bg-bg-elevated text-text-secondary rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums">
              {cantidad}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!!total && total > 0 && (
            <span className={`text-xs font-semibold tabular-nums ${colorTotal}`}>
              {formatPesos(total)}
            </span>
          )}
          <motion.div animate={{ rotate: abierta ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-text-secondary" aria-hidden />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-bg-border space-y-2 border-t px-3.5 pt-3 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
