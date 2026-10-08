'use client'

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
      <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
        <div className="flex w-max min-w-full flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => filtro.seleccionar(p.id)}
              aria-pressed={filtro.preset === p.id}
              className={`filter-pill shrink-0 ${
                filtro.preset === p.id ? 'filter-pill-active' : 'filter-pill-inactive'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {filtro.preset === 'custom' && (
        <div className="border-bg-border bg-bg-surface grid gap-3 rounded-[var(--radius-lg)] border p-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-desde`} className="text-text-secondary text-sm">
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
            <label htmlFor={`${idPrefix}-hasta`} className="text-text-secondary text-sm">
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
