'use client'

import { TarjetaConteo } from '@/components/cierre/TarjetaConteo'
import type { FilaBebida } from '@/lib/cierre/estado'
import { totalNovedades, vendidosReales } from '@/lib/cierre/ventas-vasos'
import { formatPesos } from '@/lib/utils'

/** Bebidas contadas igual que los vasos: Inicio · Llegaron · Quedan · Vendidos */
export function TablaBebidas({
  filas,
  esAdmin,
  disabled = false,
  onChange,
  onAbrirNovedades,
}: {
  filas: FilaBebida[]
  esAdmin: boolean
  disabled?: boolean
  onChange: <K extends keyof FilaBebida>(productoId: string, campo: K, valor: FilaBebida[K]) => void
  onAbrirNovedades: (productoId: string) => void
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {filas.map((fila) => {
        const vendidos = vendidosReales(fila)
        const novedades = totalNovedades(fila)
        const p = fila.producto
        return (
          <TarjetaConteo
            key={fila.producto_id}
            titulo={p.nombre}
            subtitulo={
              esAdmin && p.precio != null ? formatPesos(p.precio) : (p.unidad ?? undefined)
            }
            accion={
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAbrirNovedades(fila.producto_id)}
                className={[
                  'focus-ring min-h-9 rounded-[10px] border px-2.5 text-xs font-bold transition-colors disabled:opacity-50',
                  novedades > 0
                    ? 'border-warn-solid/60 bg-warn-soft text-warn'
                    : 'border-bg-border text-text-secondary hover:border-warn-solid/60 hover:text-warn',
                ].join(' ')}
              >
                {novedades > 0 ? `${novedades} novedad${novedades === 1 ? '' : 'es'}` : 'Novedad'}
              </button>
            }
            inicio={fila.cantidad_inicio}
            nuevos={fila.cantidad_nuevos}
            final={fila.cantidad_final}
            disabled={disabled}
            etiquetaResultado="Vendidas"
            resultado={vendidos}
            tonoResultado={vendidos === 0 ? 'neutral' : 'ok'}
            onNuevos={(n) => onChange(fila.producto_id, 'cantidad_nuevos', n)}
            onFinal={(n) => onChange(fila.producto_id, 'cantidad_final', n)}
          />
        )
      })}
    </ul>
  )
}
