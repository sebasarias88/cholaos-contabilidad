'use client'

import { formatBytes, nombreTabla, type UsoTabla } from '@/lib/almacenamiento'

/** Qué ocupa espacio, de mayor a menor */
export function TablaUso({ tablas }: { tablas: UsoTabla[] }) {
  const orden = [...tablas].sort((a, b) => b.bytes - a.bytes)
  const maximo = orden[0]?.bytes ?? 1

  return (
    <ul className="space-y-3">
      {orden.map((t) => (
        <li key={t.tabla} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-text-primary min-w-0 truncate">{nombreTabla(t.tabla)}</span>
            <span className="text-text-secondary shrink-0 text-xs tabular-nums">
              {t.filas.toLocaleString('es-CO')} registros · {formatBytes(t.bytes)}
            </span>
          </div>
          <div className="bg-bg-elevated h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-accent-cyan/70 h-full rounded-full"
              style={{ width: `${Math.max(2, (t.bytes / maximo) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
