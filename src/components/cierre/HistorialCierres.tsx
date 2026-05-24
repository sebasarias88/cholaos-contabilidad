'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CierreCard } from '@/components/cierre/CierreCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { getRangoFecha } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CierreDia } from '@/types'

type RangoPreset = 'hoy' | 'semana' | 'quincena' | 'mes' | 'custom'

const RANGOS: { id: RangoPreset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'quincena', label: 'Quincena' },
  { id: 'mes', label: 'Este mes' },
]

export function HistorialCierres() {
  const [preset, setPreset] = useState<RangoPreset>('semana')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [cierres, setCierres] = useState<CierreDia[]>([])
  const [loading, setLoading] = useState(true)

  const rango = useMemo(() => {
    if (preset === 'custom') {
      if (customDesde && customHasta) {
        return { desde: customDesde, hasta: customHasta }
      }
      return getRangoFecha('semana')
    }
    return getRangoFecha(preset)
  }, [preset, customDesde, customHasta])

  const cargar = useCallback(() => {
    setLoading(true)
    fetch(`/api/cierres?desde=${rango.desde}&hasta=${rango.hasta}`)
      .then((r) => r.json())
      .then((data: CierreDia[]) => setCierres(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Error cargando cierres'))
      .finally(() => setLoading(false))
  }, [rango.desde, rango.hasta])

  useEffect(() => {
    if (preset === 'custom' && (!customDesde || !customHasta)) return
    cargar()
  }, [cargar, preset, customDesde, customHasta])

  function seleccionarPreset(id: RangoPreset) {
    setPreset(id)
    if (id !== 'custom') {
      setCustomDesde('')
      setCustomHasta('')
    } else {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      setCustomDesde((d) => d || hoy)
      setCustomHasta((h) => h || hoy)
    }
  }

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-5 px-4 py-4 md:px-6 md:py-5"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <header>
        <h1 className="font-display text-xl font-bold text-text-primary sm:text-2xl">
          Historial de Cierres
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Un resumen por día; expande una card para ver el detalle por pestañas.
        </p>
      </header>

      <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
        <div className="flex w-max min-w-full flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => seleccionarPreset(r.id)}
              className={
                preset === r.id
                  ? 'filter-pill filter-pill-active shrink-0'
                  : 'filter-pill filter-pill-inactive shrink-0'
              }
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => seleccionarPreset('custom')}
            className={
              preset === 'custom'
                ? 'filter-pill filter-pill-active shrink-0'
                : 'filter-pill filter-pill-inactive shrink-0'
            }
          >
            Rango personalizado
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface p-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="c-desde" className="text-sm text-text-secondary">
              Desde
            </label>
            <input
              id="c-desde"
              type="date"
              value={customDesde}
              onChange={(e) => setCustomDesde(e.target.value)}
              className="select-field w-full min-w-0"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="c-hasta" className="text-sm text-text-secondary">
              Hasta
            </label>
            <input
              id="c-hasta"
              type="date"
              value={customHasta}
              min={customDesde}
              onChange={(e) => setCustomHasta(e.target.value)}
              className="select-field w-full min-w-0"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : cierres.length === 0 ? (
        <p className="text-sm text-text-muted">No hay cierres en este período.</p>
      ) : (
        <ul className="flex flex-col gap-3">
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
