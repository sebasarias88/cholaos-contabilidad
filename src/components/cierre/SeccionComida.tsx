'use client'

import { motion } from 'framer-motion'
import { Stepper } from '@/components/ui/Stepper'
import { formatPesos } from '@/lib/utils'
import type { Producto, VentaComidaInput, VentaVarianteInput } from '@/types'

interface SeccionComidaProps {
  productos: Producto[] // solo tipo 'comida'
  ventasVariantes: VentaVarianteInput[]
  ventasComida: VentaComidaInput[]
  esAdmin: boolean
  disabled?: boolean
  onVarianteChange: (varianteId: string, cantidad: number) => void
  onComidaChange: (productoId: string, cantidad: number) => void
}

function Fila({
  nombre,
  detalle,
  precio,
  cantidad,
  esAdmin,
  disabled,
  onChange,
}: {
  nombre: string
  detalle?: string | null
  precio: number | null | undefined
  cantidad: number
  esAdmin: boolean
  disabled: boolean
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-text-primary truncate text-[15px] font-bold">{nombre}</p>
        <p className="text-text-secondary truncate text-xs font-semibold tabular-nums">
          {precio != null ? formatPesos(precio) : '—'}
          {detalle ? ` · ${detalle}` : ''}
          {esAdmin && cantidad > 0 && precio != null && (
            <span className="text-ok"> · {formatPesos(cantidad * precio)}</span>
          )}
        </p>
      </div>
      <Stepper etiqueta={nombre} valor={cantidad} disabled={disabled} onChange={onChange} />
    </div>
  )
}

/** Ventas de comida: productos con variantes (pizza mesa / llevar…), otros productos y adiciones */
export function SeccionComida({
  productos,
  ventasVariantes,
  ventasComida,
  esAdmin,
  disabled = false,
  onVarianteChange,
  onComidaChange,
}: SeccionComidaProps) {
  const conVariantes = productos.filter((p) => (p.variantes ?? []).some((v) => v.activo))
  const simples = productos.filter((p) => !(p.variantes ?? []).some((v) => v.activo))
  const cantidadVariante = (id: string) =>
    ventasVariantes.find((v) => v.variante_id === id)?.cantidad ?? 0
  const cantidadComida = (id: string) =>
    ventasComida.find((v) => v.producto_id === id)?.cantidad ?? 0

  if (productos.length === 0) {
    return <p className="text-text-secondary text-sm">No hay productos de comida activos.</p>
  }

  return (
    <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {conVariantes.map((producto) => (
        <motion.section
          key={producto.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card px-4 py-3 sm:px-5"
        >
          <h3 className="font-display text-text-primary pt-1 text-lg font-bold">
            {producto.nombre}
          </h3>
          <div className="divide-bg-border divide-y">
            {(producto.variantes ?? [])
              .filter((v) => v.activo)
              .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
              .map((v) => (
                <Fila
                  key={v.id}
                  nombre={v.nombre}
                  precio={v.precio}
                  cantidad={cantidadVariante(v.id)}
                  esAdmin={esAdmin}
                  disabled={disabled}
                  onChange={(n) => onVarianteChange(v.id, n)}
                />
              ))}
          </div>
        </motion.section>
      ))}

      {[
        { titulo: 'Otros productos', lista: simples.filter((p) => !p.es_adicion) },
        { titulo: 'Adiciones', lista: simples.filter((p) => p.es_adicion) },
      ]
        .filter((g) => g.lista.length > 0)
        .map((g) => (
          <motion.section
            key={g.titulo}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card px-4 py-3 sm:px-5"
          >
            <h3 className="font-display text-text-primary pt-1 text-lg font-bold">{g.titulo}</h3>
            <div className="divide-bg-border divide-y">
              {g.lista.map((p) => (
                <Fila
                  key={p.id}
                  nombre={p.nombre}
                  detalle={p.descripcion}
                  precio={p.precio}
                  cantidad={cantidadComida(p.id)}
                  esAdmin={esAdmin}
                  disabled={disabled}
                  onChange={(n) => onComidaChange(p.id, n)}
                />
              ))}
            </div>
          </motion.section>
        ))}
    </div>
  )
}
