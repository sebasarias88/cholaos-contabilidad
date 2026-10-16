'use client'

import Link from 'next/link'
import { ChevronRight, History } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useApiGet } from '@/hooks/useApiGet'
import { sumarDias } from '@/lib/fechas'
import { filasReportePizzeria } from '@/lib/pizzeria'
import { capitalizar } from '@/lib/utils'
import { fechaComoDate } from '@/lib/fechas'
import type { MasasDia } from '@/types'

const DIAS = 14

function fechaDia(iso: string) {
  return capitalizar(
    new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }).format(
      fechaComoDate(iso)
    )
  )
}

/** Últimos días anotados (antes del día que se está viendo) */
export function HistorialPizzeria({
  hasta,
  esAdmin,
  recargar,
}: {
  hasta: string
  esAdmin: boolean
  /** Cambia cuando se guarda, para volver a cargar */
  recargar: number
}) {
  const desde = sumarDias(hasta, -DIAS)
  const fin = sumarDias(hasta, -1)
  const api = useApiGet<MasasDia[]>(`/api/masas?desde=${desde}&hasta=${fin}&v=${recargar}`)
  const registros = api.data ?? []

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-text-primary flex items-center gap-2 text-lg font-bold">
        <History size={18} className="text-brand" aria-hidden />
        Días anteriores
      </h2>

      {api.loading && !api.data ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[16px]" />
          ))}
        </div>
      ) : registros.length === 0 ? (
        <p className="text-text-secondary text-sm">
          No hay días anotados en las últimas dos semanas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {registros.map((r) => {
            const filas = filasReportePizzeria([r])
            const vendidas = filas.reduce((s, f) => s + f.vendidas, 0)
            const novedades = filas.reduce((s, f) => s + f.novedades, 0)
            const contenido = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-sm font-extrabold">{fechaDia(r.fecha)}</p>
                  <p className="text-text-secondary mt-0.5 truncate text-xs">
                    {filas
                      .filter((f) => f.vendidas > 0 || f.novedades > 0)
                      .map((f) => `${f.producto} ${f.vendidas}`)
                      .join(' · ') || 'Sin ventas'}
                  </p>
                  {novedades > 0 && (
                    <p className="text-warn mt-0.5 truncate text-xs font-semibold">
                      Novedades:{' '}
                      {filas
                        .map((f) => f.detalleNovedades)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="badge-green tabular-nums">{vendidas} vend.</span>
                  {esAdmin && <ChevronRight size={16} className="text-text-muted" aria-hidden />}
                </div>
              </>
            )
            return (
              <li key={r.id}>
                {esAdmin ? (
                  <Link
                    href={`/dashboard/pizzeria?fecha=${r.fecha}`}
                    className="card focus-ring hover:border-brand/40 flex items-center gap-3 px-4 py-3 transition-colors"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div className="card flex items-center gap-3 px-4 py-3">{contenido}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
