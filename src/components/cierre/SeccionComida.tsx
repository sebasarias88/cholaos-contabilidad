'use client'

import { Fragment } from 'react'
import {
  CeldaCantidadMobile,
  CeldaNumero,
} from '@/components/cierre/ConteoTabla'
import { SeccionHeader } from '@/components/cierre/SeccionHeader'
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

export function SeccionComida({
  productos,
  ventasVariantes,
  ventasComida,
  esAdmin,
  disabled = false,
  onVarianteChange,
  onComidaChange,
}: SeccionComidaProps) {
  const totalComida = [
    ...ventasVariantes.map((v) => {
      const variante = productos
        .flatMap((p) => p.variantes ?? [])
        .find((va) => va.id === v.variante_id)
      return (v.cantidad || 0) * (variante?.precio ?? 0)
    }),
    ...ventasComida.map((v) => {
      const producto = productos.find((p) => p.id === v.producto_id)
      return (v.cantidad || 0) * (producto?.precio ?? 0)
    }),
  ].reduce((s, v) => s + v, 0)

  const conVariantes = productos.filter(
    (p) => p.tiene_variantes || (p.variantes?.some((v) => v.activo) ?? false)
  )
  const sinVariantes = productos.filter(
    (p) => !p.tiene_variantes && !(p.variantes?.some((v) => v.activo) ?? false)
  )

  function variantesOrdenadas(producto: Producto) {
    return (producto.variantes ?? [])
      .filter((v) => v.activo)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
  }

  const colCount = esAdmin ? 4 : 3

  if (productos.length === 0) {
    return (
      <section>
        <SeccionHeader
          emoji="🍕"
          titulo="Comida"
          cantidad={0}
          esAdmin={esAdmin}
        />
        <p className="text-sm text-text-muted">
          No hay productos de comida activos.
        </p>
      </section>
    )
  }

  return (
    <section>
      <SeccionHeader
        emoji="🍕"
        titulo="Comida"
        cantidad={productos.length}
        totalVendido={totalComida}
        esAdmin={esAdmin}
      />

      {/* Mobile: filas compactas */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {conVariantes.map((producto) => (
          <li
            key={producto.id}
            className="rounded-[var(--radius-md)] border border-bg-border bg-bg-surface p-3"
          >
            <p className="mb-2 text-sm font-semibold text-text-primary">
              {producto.nombre}
            </p>
            <ul className="divide-y divide-bg-border">
              {variantesOrdenadas(producto).map((variante) => {
                const cantidad =
                  ventasVariantes.find((v) => v.variante_id === variante.id)
                    ?.cantidad ?? 0
                const subtotal = cantidad * variante.precio
                return (
                  <li
                    key={variante.id}
                    className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-x-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-primary">
                        {variante.nombre}
                      </p>
                      <p className="truncate text-xs text-text-secondary tabular-nums">
                        {formatPesos(variante.precio)}
                        {esAdmin && subtotal > 0 && (
                          <span className="ml-1.5 font-medium text-accent-green">
                            · {formatPesos(subtotal)}
                          </span>
                        )}
                      </p>
                    </div>
                    <CeldaCantidadMobile
                      value={cantidad || ''}
                      placeholder="0"
                      disabled={disabled}
                      aria-label={`Cantidad ${producto.nombre} ${variante.nombre}`}
                      onChange={(e) =>
                        onVarianteChange(
                          variante.id,
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </li>
        ))}

        {sinVariantes.map((producto) => {
          const cantidad =
            ventasComida.find((v) => v.producto_id === producto.id)?.cantidad ??
            0
          const subtotal = cantidad * (producto.precio ?? 0)
          return (
            <li
              key={producto.id}
              className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-x-3 rounded-[var(--radius-md)] border border-bg-border bg-bg-surface p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {producto.nombre}
                </p>
                {producto.descripcion && (
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {producto.descripcion}
                  </p>
                )}
                <p className="mt-0.5 truncate text-xs text-text-secondary tabular-nums">
                  {producto.precio != null ? formatPesos(producto.precio) : '—'}
                  {esAdmin && subtotal > 0 && (
                    <span className="ml-1.5 font-medium text-accent-green">
                      · {formatPesos(subtotal)}
                    </span>
                  )}
                </p>
              </div>
              <CeldaCantidadMobile
                value={cantidad || ''}
                placeholder="0"
                disabled={disabled}
                aria-label={`Cantidad ${producto.nombre}`}
                onChange={(e) =>
                  onComidaChange(
                    producto.id,
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
              />
            </li>
          )
        })}
      </ul>

      {/* Desktop: tabla */}
      <div className="table-scroll-wrap hidden min-w-0 max-w-full overflow-x-auto rounded-[var(--radius-md)] border border-bg-border md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-name">Producto / Variante</th>
              <th className="col-compact min-w-[5rem] text-center">Precio</th>
              <th className="col-compact min-w-[5rem] text-center">Cantidad</th>
              {esAdmin && (
                <th className="col-compact min-w-[5.5rem] text-right">Total</th>
              )}
            </tr>
          </thead>
          <tbody>
            {conVariantes.map((producto) => {
              const variantes = variantesOrdenadas(producto)
              return (
                <Fragment key={producto.id}>
                  <tr className="border-t border-bg-border bg-bg-elevated/40">
                    <td
                      colSpan={colCount}
                      className="col-name text-xs font-semibold text-text-secondary"
                    >
                      {producto.nombre}
                    </td>
                  </tr>
                  {variantes.map((variante) => {
                    const cantidad =
                      ventasVariantes.find((v) => v.variante_id === variante.id)
                        ?.cantidad ?? 0
                    const subtotal = cantidad * variante.precio
                    return (
                      <tr key={variante.id}>
                        <td className="col-name pl-8 text-sm text-text-primary">
                          {variante.nombre}
                        </td>
                        <td className="col-compact text-center text-xs text-text-secondary tabular-nums">
                          {formatPesos(variante.precio)}
                        </td>
                        <td className="col-compact text-center">
                          <CeldaNumero
                            value={cantidad || ''}
                            placeholder="0"
                            disabled={disabled}
                            onChange={(e) =>
                              onVarianteChange(
                                variante.id,
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                          />
                        </td>
                        {esAdmin && (
                          <td className="col-compact text-right text-xs font-semibold tabular-nums">
                            {subtotal > 0 ? (
                              <span className="text-accent-green">
                                {formatPesos(subtotal)}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}

            {sinVariantes.map((producto) => {
              const cantidad =
                ventasComida.find((v) => v.producto_id === producto.id)
                  ?.cantidad ?? 0
              const subtotal = cantidad * (producto.precio ?? 0)
              return (
                <tr key={producto.id}>
                  <td className="col-name">
                    <p className="text-sm font-semibold text-text-primary">
                      {producto.nombre}
                    </p>
                    {producto.descripcion && (
                      <p className="text-xs text-text-muted">
                        {producto.descripcion}
                      </p>
                    )}
                  </td>
                  <td className="col-compact text-center text-xs text-text-secondary tabular-nums">
                    {producto.precio != null
                      ? formatPesos(producto.precio)
                      : '—'}
                  </td>
                  <td className="col-compact text-center">
                    <CeldaNumero
                      value={cantidad || ''}
                      placeholder="0"
                      disabled={disabled}
                      onChange={(e) =>
                        onComidaChange(
                          producto.id,
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                    />
                  </td>
                  {esAdmin && (
                    <td className="col-compact text-right text-xs font-semibold tabular-nums">
                      {subtotal > 0 ? (
                        <span className="text-accent-green">
                          {formatPesos(subtotal)}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
