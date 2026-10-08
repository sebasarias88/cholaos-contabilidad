'use client'

import { CeldaNumero } from '@/components/cierre/ConteoTabla'
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
      <p className="text-accent-red mt-2 text-xs">
        Sin productos ligados a este vaso. Asócialos en Productos.
      </p>
    )
  }

  if (productos.length === 1) {
    const p = productos[0]
    return (
      <p className="text-text-secondary mt-2 text-xs">
        Todo lo vendido → <span className="text-text-primary font-medium">{p.nombre}</span>
        {esAdmin && p.precio != null && p.precio > 0 && (
          <span className="tabular-nums"> · {formatPesos(p.precio)}</span>
        )}
      </p>
    )
  }

  const suma = sumaDesglose(desglose)
  const ok = vendidos === 0 || suma === vendidos

  return (
    <div className="border-bg-border mt-3 space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-text-secondary text-[10px] font-semibold tracking-wide uppercase">
          Desglose por producto
        </p>
        <p
          className={[
            'text-[11px] font-medium tabular-nums',
            ok ? 'text-text-secondary' : 'text-accent-red',
          ].join(' ')}
        >
          {suma} / {vendidos}
          {!ok && vendidos > 0 ? ' · debe cuadrar' : ''}
        </p>
      </div>
      <ul className="space-y-1.5">
        {productos.map((p) => {
          const qty = desglose.find((d) => d.producto_id === p.id)?.cantidad ?? 0
          return (
            <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2">
              <div className="min-w-0">
                <p className="text-text-primary truncate text-xs font-medium">{p.nombre}</p>
                {esAdmin && p.precio != null && (
                  <p className="text-text-secondary text-[10px] tabular-nums">
                    {formatPesos(p.precio)}
                  </p>
                )}
              </div>
              <CeldaNumero
                value={qty || ''}
                placeholder="0"
                disabled={disabled || vendidos === 0}
                className="!h-9 !min-w-0 text-sm"
                aria-label={`Cantidad ${p.nombre}`}
                onChange={(e) =>
                  onDesgloseChange(tallaId, p.id, Math.max(0, Number(e.target.value) || 0))
                }
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
