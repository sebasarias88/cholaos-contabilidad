'use client'

import { retiroBase } from '@/lib/cierre/base'
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
      (cierre.total_domicilios ?? 0) -
      (cierre.total_descuentos ?? 0)

  const retiro = retiroBase(cierre)
  const huboBaseNueva = cierre.base_nueva != null && cierre.base_anterior != null
  const filasBase = huboBaseNueva
    ? [
        {
          label: 'Base de anoche',
          value: formatPesos(cierre.base_anterior ?? 0),
          color: 'text-text-primary',
        },
        {
          label: 'Base nueva',
          value: formatPesos(cierre.base_nueva ?? 0),
          color: 'text-text-primary',
        },
        {
          label: retiro >= 0 ? 'Retiro de base' : 'Se metió a la base',
          value: formatPesos(Math.abs(retiro)),
          color: retiro >= 0 ? 'text-warn' : 'text-ok',
        },
      ]
    : [
        {
          label: 'Base inicio',
          value: formatPesos(cierre.dinero_base_inicio),
          color: 'text-text-primary',
        },
      ]

  const movimientos = [
    ...filasBase,
    {
      label: 'Ventas',
      value: formatPesos(cierre.total_ventas),
      color: 'text-brand',
    },
    {
      label: 'Gastos',
      value: formatPesos(cierre.total_gastos),
      color: 'text-bad',
    },
    {
      label: 'Transferencias',
      value: formatPesos(cierre.total_transferencias),
      color: 'text-warn',
    },
    {
      label: 'Domicilios',
      value: formatPesos(cierre.total_domicilios ?? 0),
      color: 'text-brand',
    },
    ...(Number(cierre.total_descuentos ?? 0) > 0
      ? [
          {
            label: 'Descuentos',
            value: formatPesos(Number(cierre.total_descuentos)),
            color: 'text-warn',
          },
        ]
      : []),
  ]

  const textoDiferencia =
    diferencia === 0
      ? 'Cuadre exacto'
      : diferencia < 0
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : `Sobran ${formatPesos(diferencia)}`

  const colorDiferencia = diferencia === 0 ? 'text-ok' : diferencia < 0 ? 'text-bad' : 'text-warn'

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

          <div
            className={`hidden md:grid md:gap-3 ${huboBaseNueva ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}
          >
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
              ? 'border-ok/30 bg-ok/10'
              : diferencia < 0
                ? 'border-bad/30 bg-bad-soft'
                : 'border-warn-solid/40 bg-warn-soft',
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
