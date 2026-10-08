'use client'

import { formatPesos } from '@/lib/utils'
import type { CierreDia } from '@/types'

export function TabMovimientos({ cierre }: { cierre: CierreDia }) {
  const gastos = cierre.gastos ?? []
  const transferencias = cierre.transferencias ?? []
  const domicilios = cierre.domicilios ?? []

  if (gastos.length === 0 && transferencias.length === 0 && domicilios.length === 0) {
    return <p className="text-text-muted text-sm">Sin gastos, transferencias ni domicilios.</p>
  }

  return (
    <ul className="divide-bg-border/60 divide-y">
      {gastos.map((g) => (
        <li key={g.id} className="flex justify-between gap-3 py-2.5 text-sm">
          <span className="text-text-primary">Gasto — {g.descripcion}</span>
          <span className="text-text-secondary shrink-0 tabular-nums">{formatPesos(g.monto)}</span>
        </li>
      ))}
      {transferencias.map((t) => (
        <li key={t.id} className="flex justify-between gap-3 py-2.5 text-sm">
          <span className="text-text-primary capitalize">
            Transfer. — {t.medio?.nombre ?? t.descripcion}
          </span>
          <span className="text-text-secondary shrink-0 tabular-nums">{formatPesos(t.monto)}</span>
        </li>
      ))}
      {domicilios.map((d) => (
        <li key={d.id} className="flex justify-between gap-3 py-2.5 text-sm">
          <span className="text-text-primary">
            Domicilio{d.descripcion ? ` — ${d.descripcion}` : ''}
          </span>
          <span className="text-text-secondary shrink-0 tabular-nums">{formatPesos(d.monto)}</span>
        </li>
      ))}
    </ul>
  )
}
