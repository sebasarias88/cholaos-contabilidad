'use client'

import { motion } from 'framer-motion'
import { CierreCard } from '@/components/cierre/CierreCard'
import { FiltroRango } from '@/components/ui/FiltroRango'
import { Skeleton } from '@/components/ui/Skeleton'
import { useApiGet } from '@/hooks/useApiGet'
import { useRangoFechas } from '@/hooks/useRangoFechas'
import { fadeUp } from '@/lib/animations'
import type { CierreDia } from '@/types'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'

export function HistorialCierres() {
  const filtro = useRangoFechas('semana')
  const { rango, completo } = filtro
  const { data, loading, error } = useApiGet<CierreDia[]>(
    completo ? `/api/cierres?desde=${rango.desde}&hasta=${rango.hasta}` : null
  )
  const cierres = data ?? []

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <EncabezadoPagina
        titulo="Historial de cierres"
        descripcion="Un resumen por día. Toca una tarjeta para ver el detalle."
      />

      <FiltroRango filtro={filtro} idPrefix="cierres" />

      {error && <p className="text-bad text-sm">{error}</p>}

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
