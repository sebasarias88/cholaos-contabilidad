'use client'

import { getDiferenciaCierre } from '@/lib/cierre/historial'
import { formatPesos } from '@/lib/utils'
import type { CierreDia } from '@/types'

export function TabResumen({ cierre, esAdmin }: { cierre: CierreDia; esAdmin: boolean }) {
  const diferencia = getDiferenciaCierre(cierre)
  const esperado =
    cierre.efectivo_esperado ??
    cierre.dinero_base_inicio +
      cierre.total_ventas -
      cierre.total_transferencias -
      cierre.total_gastos -
      (cierre.total_domicilios ?? 0)

  const movimientos = [
    {
      label: 'Base inicio',
      value: formatPesos(cierre.dinero_base_inicio),
      color: 'text-text-primary',
    },
    {
      label: 'Ventas',
      value: formatPesos(cierre.total_ventas),
      color: 'text-accent-cyan',
    },
    {
      label: 'Gastos',
      value: formatPesos(cierre.total_gastos),
      color: 'text-accent-red',
    },
    {
      label: 'Transferencias',
      value: formatPesos(cierre.total_transferencias),
      color: 'text-amber-400',
    },
    {
      label: 'Domicilios',
      value: formatPesos(cierre.total_domicilios ?? 0),
      color: 'text-orange-400',
    },
  ]

  const textoDiferencia =
    diferencia === 0
      ? 'Cuadre exacto'
      : diferencia < 0
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : `Sobran ${formatPesos(diferencia)}`

  const colorDiferencia =
    diferencia === 0 ? 'text-emerald-400' : diferencia < 0 ? 'text-accent-red' : 'text-amber-400'

  return (
    <div className="space-y-4">
      {esAdmin && (
        <>
          <div className="divide-bg-border/70 border-bg-border divide-y overflow-hidden rounded-[var(--radius-md)] border md:hidden">
            {movimientos.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-text-secondary text-sm">{s.label}</span>
                <span className={`text-sm font-semibold tabular-nums ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="hidden md:grid md:grid-cols-5 md:gap-3">
            {movimientos.map((s) => (
              <div
                key={s.label}
                className="border-bg-border bg-bg-elevated/60 rounded-[var(--radius-md)] border px-3 py-3"
              >
                <p className="text-text-muted text-[11px] font-medium tracking-wide uppercase">
                  {s.label}
                </p>
                <p className={`mt-1.5 text-base font-semibold tabular-nums ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="bg-bg-elevated space-y-2 rounded-[var(--radius-md)] p-4 text-sm md:hidden">
        {esAdmin && (
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Efectivo esperado</span>
            <span className="text-text-primary font-medium tabular-nums">
              {formatPesos(esperado)}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-text-secondary">Dinero contado</span>
          <span className="text-text-primary font-medium tabular-nums">
            {formatPesos(cierre.dinero_final)}
          </span>
        </div>
        <div className="border-bg-border flex justify-between gap-3 border-t pt-2 font-medium">
          <span className="text-text-secondary">Diferencia</span>
          <span className={`tabular-nums ${colorDiferencia}`}>{textoDiferencia}</span>
        </div>
        {cierre.usuario?.nombre && (
          <p className="border-bg-border text-text-muted border-t pt-2 text-xs">
            Registrado por {cierre.usuario.nombre} ·{' '}
            <span className="capitalize">{cierre.estado}</span>
          </p>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-3 md:gap-3">
        {esAdmin && (
          <div className="border-bg-border rounded-[var(--radius-md)] border px-4 py-3">
            <p className="text-text-muted text-[11px] font-medium tracking-wide uppercase">
              Efectivo esperado
            </p>
            <p className="text-text-primary mt-1.5 text-lg font-semibold tabular-nums">
              {formatPesos(esperado)}
            </p>
          </div>
        )}
        <div className="border-bg-border rounded-[var(--radius-md)] border px-4 py-3">
          <p className="text-text-muted text-[11px] font-medium tracking-wide uppercase">
            Dinero contado
          </p>
          <p className="text-text-primary mt-1.5 text-lg font-semibold tabular-nums">
            {formatPesos(cierre.dinero_final)}
          </p>
        </div>
        <div
          className={[
            'rounded-[var(--radius-md)] border px-4 py-3',
            diferencia === 0
              ? 'border-emerald-400/30 bg-emerald-400/10'
              : diferencia < 0
                ? 'border-accent-red/30 bg-accent-red-dim'
                : 'border-amber-400/30 bg-amber-500/10',
          ].join(' ')}
        >
          <p className="text-text-muted text-[11px] font-medium tracking-wide uppercase">
            Diferencia
          </p>
          <p className={`mt-1.5 text-lg font-semibold tabular-nums ${colorDiferencia}`}>
            {textoDiferencia}
          </p>
        </div>
      </div>

      {cierre.observaciones && (
        <p className="text-text-secondary text-xs">
          <span className="text-text-primary">Nota:</span> {cierre.observaciones}
        </p>
      )}
    </div>
  )
}
