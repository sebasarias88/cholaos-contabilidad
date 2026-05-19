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
    <div className="table-surface overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Vendedor</th>
            <th className="px-4 py-3">Vasos</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <tr key={venta.id}>
              <td className="px-4 py-3 text-text-primary">
                {formatFecha(venta.fecha)}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {venta.usuario?.nombre ?? venta.usuario_id}
              </td>
              <td className="px-4 py-3">
                <span className="badge-cyan">{totalVasos(venta)}</span>
              </td>
              <td className="px-4 py-3 font-medium text-accent-cyan">
                {formatPesos(venta.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
