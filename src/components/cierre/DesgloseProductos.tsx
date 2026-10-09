'use client'

import { Stepper } from '@/components/ui/Stepper'
import { sumaDesglose } from '@/lib/cierre/ventas-vasos'
import { formatPesos } from '@/lib/utils'
import type { ConteoVasoValor, Producto } from '@/types'

/** Reparto de los vasos vendidos entre los productos que comparten el vaso */
export function DesgloseProductos({
  tallaId,
  productos,
  desglose,
  vendidos,
  esAdmin,
  disabled,
  onDesgloseChange,
}: {
  tallaId: string
  productos: Producto[]
  desglose: ConteoVasoValor['desglose']
  vendidos: number
  esAdmin: boolean
  disabled?: boolean
  onDesgloseChange: (tallaId: string, productoId: string, cantidad: number) => void
}) {
  if (productos.length === 0) {
    return (
      <p className="badge-bad self-start">
        Sin productos ligados a este vaso. Asócialos en Productos.
      </p>
    )
  }
  if (productos.length === 1) return null

  const suma = sumaDesglose(desglose)
  const ok = suma === vendidos
  const faltan = vendidos - suma

  return (
    <div className="border-bg-border flex flex-col gap-2.5 border-t border-dashed pt-3.5">
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <span className="text-text-secondary">¿Cuánto de cada uno?</span>
        <span className={vendidos === 0 ? 'text-text-muted' : ok ? 'text-ok' : 'text-brand-strong'}>
          {vendidos === 0
            ? 'Sin ventas'
            : ok
              ? `${suma} de ${vendidos} ✓`
              : faltan > 0
                ? `Faltan ${faltan}`
                : `Sobran ${-faltan}`}
        </span>
      </div>
      <ul className="grid gap-2 @xl:grid-cols-2">
        {productos.map((p) => {
          const qty = desglose.find((d) => d.producto_id === p.id)?.cantidad ?? 0
          return (
            <li
              key={p.id}
              className="bg-bg-elevated/70 flex items-center justify-between gap-2 rounded-[14px] py-1.5 pr-1.5 pl-3"
            >
              <div className="min-w-0">
                <p className="text-text-primary truncate text-sm font-bold">{p.nombre}</p>
                {esAdmin && p.precio != null && (
                  <p className="text-text-secondary text-xs tabular-nums">
                    {formatPesos(p.precio)}
                  </p>
                )}
              </div>
              <Stepper
                tamano="sm"
                etiqueta={p.nombre}
                valor={qty}
                disabled={disabled || vendidos === 0}
                onChange={(n) => onDesgloseChange(tallaId, p.id, n)}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
