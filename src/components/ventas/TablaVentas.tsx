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
      <p className="text-sm text-zinc-500">No hay ventas registradas aún.</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Vendedor</th>
            <th className="px-4 py-3 font-medium">Vasos</th>
            <th className="px-4 py-3 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <tr
              key={venta.id}
              className="border-t border-zinc-200 dark:border-zinc-800"
            >
              <td className="px-4 py-3">{formatFecha(venta.fecha)}</td>
              <td className="px-4 py-3">
                {venta.usuario?.nombre ?? venta.usuario_id}
              </td>
              <td className="px-4 py-3">{totalVasos(venta)}</td>
              <td className="px-4 py-3 font-medium">
                {formatPesos(venta.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
