'use client'

import { formatPesos } from '@/lib/utils'
import type { ProductoVendido } from '@/lib/reportes'

export function ProductosVendidosLista({ productos }: { productos: ProductoVendido[] }) {
  return (
    <>
      {/* Vista móvil: tarjetas */}
      <ul className="flex flex-col gap-3 md:hidden">
        {productos.map((p, i) => (
          <li
            key={p.producto_id}
            className="border-bg-border bg-bg-elevated/30 rounded-[var(--radius-md)] border p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-text-secondary text-[10px] font-semibold tracking-wide uppercase">
                    #{i + 1}
                  </span>
                  {p.medida && <span className="badge-brand tabular-nums">{p.medida}</span>}
                </div>
                <p className="text-text-primary mt-1 text-sm leading-snug font-semibold">
                  {p.nombre}
                </p>
                <p className="text-text-muted text-xs">
                  {p.tipo}
                  {p.medida ? ` · ${p.medida}` : ''}
                </p>
              </div>
              <p className="text-brand shrink-0 text-base font-semibold tabular-nums">
                {formatPesos(p.ingresos)}
              </p>
            </div>
            <div className="border-bg-border mt-3 flex items-center justify-between gap-3 border-t pt-2.5">
              <span className="text-text-secondary text-xs">Cantidad</span>
              <span className="text-text-primary text-sm font-semibold tabular-nums">
                {p.cantidad}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Vista escritorio: tabla */}
      <div className="table-surface hidden max-w-full min-w-0 md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-name">Producto</th>
              <th className="col-compact min-w-[5.5rem]">Tipo</th>
              <th className="col-compact min-w-[5rem]">Cantidad</th>
              <th className="col-compact min-w-[6.5rem] text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.producto_id}>
                <td className="col-name">
                  <span className="text-text-muted mr-2">#{i + 1}</span>
                  <span className="text-text-primary font-medium">{p.nombre}</span>
                </td>
                <td className="col-compact text-text-secondary">
                  {p.tipo}
                  {p.medida ? (
                    <span className="text-text-muted mt-0.5 block text-xs">{p.medida}</span>
                  ) : null}
                </td>
                <td className="col-compact">
                  <span className="badge-brand tabular-nums">{p.cantidad}</span>
                </td>
                <td className="col-compact text-brand text-right font-medium tabular-nums">
                  {formatPesos(p.ingresos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
