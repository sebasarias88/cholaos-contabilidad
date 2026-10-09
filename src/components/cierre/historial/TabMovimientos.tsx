'use client'

import { formatPesos } from '@/lib/utils'
import type { CierreDia } from '@/types'

export function TabMovimientos({ cierre }: { cierre: CierreDia }) {
  const gastos = cierre.gastos ?? []
  const transferencias = cierre.transferencias ?? []
  const domicilios = cierre.domicilios ?? []
  const descuentos = cierre.descuentos ?? []

  if (
    gastos.length === 0 &&
    transferencias.length === 0 &&
    domicilios.length === 0 &&
    descuentos.length === 0
  ) {
    return (
      <p className="text-text-muted text-sm">
        Sin gastos, transferencias, domicilios ni descuentos.
      </p>
    )
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
          <span className="text-text-primary">Transfer. — {t.medio?.nombre ?? t.descripcion}</span>
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
      {descuentos.map((d) => (
        <li key={d.id} className="flex justify-between gap-3 py-2.5 text-sm">
          <span className="text-text-primary">Descuento — {d.descripcion}</span>
          <span className="text-warn shrink-0 font-semibold tabular-nums">
            −{formatPesos(d.monto)}
          </span>
        </li>
      ))}
    </ul>
  )
}
