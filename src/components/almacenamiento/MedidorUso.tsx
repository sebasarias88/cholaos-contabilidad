'use client'

import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import { formatBytes, LIMITE_BD_BYTES, nivelUso, porcentajeUso } from '@/lib/almacenamiento'

const COLOR = {
  normal: { barra: 'bg-accent-green', texto: 'text-accent-green', msg: 'Todo en orden' },
  aviso: { barra: 'bg-amber-400', texto: 'text-amber-400', msg: 'Conviene planear una limpieza' },
  critico: { barra: 'bg-accent-red', texto: 'text-accent-red', msg: 'Haz una limpieza pronto' },
}

/** Barra de uso de la base de datos frente al límite del plan gratuito */
export function MedidorUso({
  bytes,
  diasRestantes,
}: {
  bytes: number
  diasRestantes: number | null
}) {
  const nivel = nivelUso(bytes)
  const pct = porcentajeUso(bytes)
  const color = COLOR[nivel]

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-text-secondary flex items-center gap-2 text-sm">
            <Database size={16} className="text-accent-cyan" aria-hidden />
            Base de datos
          </p>
          <p className="font-display text-text-primary mt-2 text-3xl font-bold tabular-nums">
            {formatBytes(bytes)}
            <span className="text-text-secondary ml-2 text-base font-normal">
              de {formatBytes(LIMITE_BD_BYTES)}
            </span>
          </p>
        </div>
        <span className={`text-2xl font-semibold tabular-nums ${color.texto}`}>
          {pct < 1 ? pct.toFixed(1) : Math.round(pct)}%
        </span>
      </div>

      <div
        className="bg-bg-elevated mt-4 h-3 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Uso del almacenamiento"
      >
        <motion.div
          className={`h-full rounded-full ${color.barra}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 0.8)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={color.texto}>{color.msg}</span>
        <span className="text-text-secondary">
          {diasRestantes === null
            ? 'Calculando ritmo de crecimiento (se necesita al menos una semana de datos)'
            : diasRestantes > 3650
              ? 'Al ritmo actual hay espacio para más de 10 años'
              : `Al ritmo actual se llenaría en ~${Math.max(1, Math.round(diasRestantes / 30))} meses`}
        </span>
      </div>
      <p className="text-text-muted mt-3 text-[11px]">
        Incluye unos 10 MB que usa el propio sistema de la base de datos. Plan gratuito de Supabase:
        500 MB.
      </p>
    </div>
  )
}
