'use client'

import { PildorasFiltro } from '@/components/ui/PildorasFiltro'
import type { PresetRango, RangoFechasApi } from '@/hooks/useRangoFechas'

const PRESETS: { id: PresetRango; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'quincena', label: 'Quincena' },
  { id: 'mes', label: 'Este mes' },
  { id: 'custom', label: 'Personalizado' },
]

/** Pastillas de período + fechas personalizadas */
export function FiltroRango({ filtro, idPrefix }: { filtro: RangoFechasApi; idPrefix: string }) {
  return (
    <div className="flex flex-col gap-3">
      <PildorasFiltro
        opciones={PRESETS}
        valor={filtro.preset}
        onChange={filtro.seleccionar}
        id={idPrefix}
        etiqueta="Período"
      />

      {filtro.preset === 'custom' && (
        <div className="border-bg-border bg-bg-surface grid gap-3 rounded-[var(--radius-lg)] border p-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-desde`} className="text-text-primary text-sm font-bold">
              Desde
            </label>
            <input
              id={`${idPrefix}-desde`}
              type="date"
              value={filtro.customDesde}
              max={filtro.customHasta || undefined}
              onChange={(e) => filtro.setCustomDesde(e.target.value)}
              className="select-field w-full min-w-0"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-hasta`} className="text-text-primary text-sm font-bold">
              Hasta
            </label>
            <input
              id={`${idPrefix}-hasta`}
              type="date"
              value={filtro.customHasta}
              min={filtro.customDesde || undefined}
              onChange={(e) => filtro.setCustomHasta(e.target.value)}
              className="select-field w-full min-w-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
