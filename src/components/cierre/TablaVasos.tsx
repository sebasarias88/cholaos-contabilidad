'use client'

import { DesgloseProductos } from '@/components/cierre/DesgloseProductos'
import { TarjetaConteo } from '@/components/cierre/TarjetaConteo'
import type { FilaVaso } from '@/lib/cierre/estado'
import { desgloseCuadra, totalNovedades, vendidosReales } from '@/lib/cierre/ventas-vasos'
import { formatPesos } from '@/lib/utils'
import type { Producto } from '@/types'

interface TablaVasosProps {
  filas: FilaVaso[]
  esAdmin: boolean
  disabled?: boolean
  productosPorTalla: Record<string, Producto[]>
  onChange: <K extends keyof FilaVaso>(tallaId: string, campo: K, valor: FilaVaso[K]) => void
  onDesgloseChange: (tallaId: string, productoId: string, cantidad: number) => void
  onAbrirNovedades: (tallaId: string) => void
}

function subtitulo(productos: Producto[], esAdmin: boolean) {
  if (productos.length === 1) {
    const p = productos[0]
    return esAdmin && p.precio != null ? `${p.nombre} · ${formatPesos(p.precio)}` : p.nombre
  }
  return productos.map((p) => p.nombre).join(' · ')
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
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {filas.map((fila) => {
        const productos = productosPorTalla[fila.talla_id] ?? []
        const vendidos = vendidosReales(fila)
        const novedades = totalNovedades(fila)
        const cuadra = productos.length <= 1 || desgloseCuadra(fila)
        const titulo =
          fila.talla?.descripcion ?? productos[0]?.nombre ?? `${fila.talla?.onzas ?? ''} oz`

        return (
          <TarjetaConteo
            key={fila.talla_id}
            titulo={titulo}
            subtitulo={subtitulo(productos, esAdmin)}
            ancho={productos.length > 1}
            accion={
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAbrirNovedades(fila.talla_id)}
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
            etiquetaResultado="Vendidos"
            resultado={vendidos}
            tonoResultado={vendidos === 0 ? 'neutral' : cuadra ? 'ok' : 'bad'}
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
