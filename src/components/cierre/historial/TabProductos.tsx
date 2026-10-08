'use client'

import { type ProductoVendidoHistorial } from '@/lib/cierre/historial'
import { formatPesos } from '@/lib/utils'
import type { CierreDia } from '@/types'

export function TabProductos({
  items,
  cargando,
  cierre,
  esAdmin,
}: {
  items: ProductoVendidoHistorial[]
  cargando: boolean
  cierre: CierreDia
  esAdmin: boolean
}) {
  const ventasVariantes = cierre.ventas_variantes ?? []
  const ventasComida = cierre.ventas_comida ?? []
  const hayComida = ventasVariantes.length > 0 || ventasComida.length > 0

  const variantesPorProducto = ventasVariantes.reduce<Record<string, typeof ventasVariantes>>(
    (acc, v) => {
      const nombreProd = v.variante?.producto?.nombre ?? 'Producto'
      if (!acc[nombreProd]) acc[nombreProd] = []
      acc[nombreProd].push(v)
      return acc
    },
    {}
  )

  if (cargando && items.length === 0 && !hayComida) {
    return <p className="text-text-muted text-sm">Cargando productos...</p>
  }

  if (items.length === 0 && !hayComida) {
    return <p className="text-text-muted text-sm">Sin productos vendidos.</p>
  }

  return (
    <div className="space-y-5">
      {items.length > 0 && (
        <div className="space-y-1">
          <p className="text-text-secondary mb-2 text-xs font-medium tracking-wide uppercase">
            Vasos
          </p>
          <ul className="divide-bg-border/60 divide-y">
            {items.map((p) => (
              <li
                key={p.producto_id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="text-text-primary min-w-0 capitalize">
                  {p.nombre} {p.onzas}oz
                  <span className="text-text-muted ml-2">×{p.cantidad}</span>
                </span>
                {esAdmin && (
                  <span className="text-accent-cyan shrink-0 font-medium tabular-nums">
                    {formatPesos(p.subtotal)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hayComida && (
        <div className="space-y-2">
          <p className="text-text-secondary mb-2 text-xs font-medium tracking-wide uppercase">
            Comida
          </p>

          {Object.entries(variantesPorProducto).map(([nombreProd, variantes]) => (
            <div key={nombreProd} className="space-y-0.5">
              <p className="text-text-secondary text-xs font-medium">{nombreProd}</p>
              {variantes.map((v) => {
                const precio = v.precio_unitario ?? v.variante?.precio ?? 0
                const subtotal = v.cantidad * precio
                return (
                  <div key={v.id} className="flex justify-between gap-3 py-1 pl-3 text-xs">
                    <span className="text-text-muted min-w-0">
                      {v.variante?.nombre ?? 'Variante'} ×{v.cantidad}
                    </span>
                    {esAdmin && (
                      <span className="text-accent-green shrink-0 tabular-nums">
                        {formatPesos(subtotal)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {ventasComida.map((v) => {
            const precio = v.precio_unitario ?? v.producto?.precio ?? 0
            const subtotal = v.cantidad * precio
            return (
              <div key={v.id} className="flex justify-between gap-3 py-1.5 text-xs">
                <span className="text-text-secondary min-w-0">
                  {v.producto?.nombre ?? 'Producto'} ×{v.cantidad}
                </span>
                {esAdmin && (
                  <span className="text-accent-green shrink-0 tabular-nums">
                    {formatPesos(subtotal)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
