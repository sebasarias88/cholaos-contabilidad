'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { formatPesos } from '@/lib/utils'
import type { ResumenDia } from '@/types'

/** Barras simples de ingresos de los últimos 7 días (la de hoy resaltada) */
export function BarrasSemana({ dias, hoy }: { dias: ResumenDia[]; hoy: string }) {
  const max = Math.max(1, ...dias.map((d) => d.ingresos))
  return (
    <div className="flex h-full min-h-[220px] flex-1 items-end gap-2 sm:gap-3" role="list">
      {dias.map((d, i) => {
        const esHoy = d.fecha === hoy
        const alto = Math.max(4, (d.ingresos / max) * 100)
        return (
          <div
            key={d.fecha}
            role="listitem"
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            aria-label={`${format(parseISO(d.fecha), 'EEEE d', { locale: es })}: ${formatPesos(d.ingresos)}`}
          >
            <span
              className={`text-[11px] font-extrabold tabular-nums sm:text-xs ${esHoy ? 'text-brand' : 'text-text-secondary'}`}
            >
              {d.ingresos > 0 ? `${Math.round(d.ingresos / 1000)}k` : ''}
            </span>
            <motion.div
              className={`w-full max-w-12 rounded-t-[10px] rounded-b-[4px] ${
                esHoy ? 'bg-brand shadow-brand' : 'bg-brand/20 group-hover:bg-brand/40'
              } transition-colors`}
              initial={{ height: 0 }}
              animate={{ height: `${alto}%` }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <span
              className={`text-xs capitalize ${esHoy ? 'text-brand font-extrabold' : 'text-text-muted font-semibold'}`}
            >
              {esHoy ? 'Hoy' : format(parseISO(d.fecha), 'EEE', { locale: es })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
