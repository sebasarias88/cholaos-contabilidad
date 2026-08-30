import { formatFecha, formatPesos } from '@/lib/utils'
import type { Venta } from '@/types'

interface TablaVentasProps {
  ventas: Venta[]
}

function totalVasos(venta: Venta) {
  return venta.detalle?.reduce((acc, d) => acc + d.cantidad, 0) ?? 0
}

export function TablaVentas({ ventas }: TablaVentasProps) {
  if (ventas.length === 0) {
    return (
      <p className="text-sm text-text-muted">No hay ventas registradas aún.</p>
    )
  }

  return (
    <div className="table-surface min-w-0 max-w-full">
      <table className="data-table">
        <thead>
          <tr>
            <th className="col-compact min-w-[7rem]">Fecha</th>
            <th className="col-name min-w-[8rem]">Vendedor</th>
            <th className="col-compact min-w-[4.5rem]">Vasos</th>
            <th className="col-compact min-w-[6.5rem]">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <tr key={venta.id}>
              <td className="col-compact text-text-primary">
                {formatFecha(venta.fecha)}
              </td>
              <td className="col-name text-text-secondary">
                {venta.usuario?.nombre ?? venta.usuario_id}
              </td>
              <td className="col-compact">
                <span className="badge-cyan">{totalVasos(venta)}</span>
              </td>
              <td className="col-compact font-medium text-accent-cyan tabular-nums">
                {formatPesos(venta.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
