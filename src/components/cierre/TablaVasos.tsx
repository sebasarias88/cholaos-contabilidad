'use client'

import { DesgloseProductos } from '@/components/cierre/DesgloseProductos'
import { TarjetaConteo } from '@/components/cierre/TarjetaConteo'
import type { FilaVaso } from '@/lib/cierre/estado'
import { desgloseCuadra, totalNovedades, vendidosReales } from '@/lib/cierre/ventas-vasos'
import { formatTalla } from '@/lib/utils'
import type { Producto } from '@/types'

function nombreVaso(fila: FilaVaso, productos: Producto[]) {
  const talla = fila.talla
  const descripcion = talla?.descripcion ?? productos[0]?.nombre
  const medida = talla ? formatTalla(talla) : ''
  if (descripcion && medida && descripcion !== medida) return `${descripcion} · ${medida}`
  return descripcion ?? (medida || 'Vaso')
}

interface TablaVasosProps {
  filas: FilaVaso[]
  esAdmin: boolean
  disabled?: boolean
  productosPorTalla: Record<string, Producto[]>
  onChange: <K extends keyof FilaVaso>(tallaId: string, campo: K, valor: FilaVaso[K]) => void
  onDesgloseChange: (tallaId: string, productoId: string, cantidad: number) => void
  onAbrirNovedades: (tallaId: string) => void
}

export function TablaVasos({
  filas,
  esAdmin,
  disabled = false,
  productosPorTalla,
  onChange,
  onDesgloseChange,
  onAbrirNovedades,
}: TablaVasosProps) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {filas.map((fila) => {
        const productos = productosPorTalla[fila.talla_id] ?? []
        const vendidos = vendidosReales(fila)
        const novedades = totalNovedades(fila)
        const cuadra = productos.length <= 1 || desgloseCuadra(fila)

        return (
          <TarjetaConteo
            key={fila.talla_id}
            titulo={nombreVaso(fila, productos)}
            subtitulo={
              productos.length > 1 ? `${productos.length} productos en este vaso` : undefined
            }
            accion={
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAbrirNovedades(fila.talla_id)}
                className={[
                  'h-8 shrink-0 rounded-[var(--radius-md)] border px-2.5 text-xs font-medium transition-colors disabled:opacity-50',
                  novedades > 0
                    ? 'border-accent-amber/40 bg-accent-amber/15 text-accent-amber'
                    : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-accent-amber/40 hover:text-accent-amber',
                ].join(' ')}
              >
                {novedades > 0 ? `Novedades ${novedades}` : 'Novedades'}
              </button>
            }
            inicio={fila.cantidad_inicio}
            nuevos={fila.cantidad_nuevos}
            final={fila.cantidad_final}
            disabled={disabled}
            etiquetaResultado="Vendidos"
            resultado={vendidos}
            claseResultado={
              vendidos === 0 ? 'text-text-muted' : cuadra ? 'text-accent-cyan' : 'text-accent-red'
            }
            onNuevos={(n) => onChange(fila.talla_id, 'cantidad_nuevos', n)}
            onFinal={(n) => onChange(fila.talla_id, 'cantidad_final', n)}
          >
            <DesgloseProductos
              tallaId={fila.talla_id}
              productos={productos}
              desglose={fila.desglose}
              vendidos={vendidos}
              esAdmin={esAdmin}
              disabled={disabled}
              onDesgloseChange={onDesgloseChange}
            />
          </TarjetaConteo>
        )
      })}
    </ul>
  )
}
