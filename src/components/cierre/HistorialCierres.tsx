'use client'

import { motion } from 'framer-motion'
import { CierreCard } from '@/components/cierre/CierreCard'
import { FiltroRango } from '@/components/ui/FiltroRango'
import { Skeleton } from '@/components/ui/Skeleton'
import { useApiGet } from '@/hooks/useApiGet'
import { useRangoFechas } from '@/hooks/useRangoFechas'
import { fadeUp } from '@/lib/animations'
import type { CierreDia } from '@/types'

export function HistorialCierres() {
  const filtro = useRangoFechas('semana')
  const { rango, completo } = filtro
  const { data, loading, error } = useApiGet<CierreDia[]>(
    completo ? `/api/cierres?desde=${rango.desde}&hasta=${rango.hasta}` : null
  )
  const cierres = data ?? []

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-5 px-4 py-4 md:px-6 md:py-5"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <header>
        <h1 className="font-display text-text-primary text-xl font-bold sm:text-2xl">
          Historial de Cierres
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Un resumen por día; expande una tarjeta para ver el detalle.
        </p>
      </header>

      <FiltroRango filtro={filtro} idPrefix="cierres" />

      {error && <p className="text-accent-red text-sm">{error}</p>}

      {loading && !data ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : cierres.length === 0 ? (
        <p className="text-text-muted text-sm">No hay cierres en este período.</p>
      ) : (
        <ul className={`flex flex-col gap-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {cierres.map((c) => (
            <li key={c.id}>
              <CierreCard cierre={c} esAdmin />
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
