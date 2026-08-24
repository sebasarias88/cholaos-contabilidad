'use client'

import { Fragment } from 'react'
import { CeldaNumero } from '@/components/cierre/ConteoTabla'
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

      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {conVariantes.map((producto) => (
          <li
            key={producto.id}
            className="rounded-[var(--radius-md)] border border-bg-border bg-bg-surface p-3.5"
          >
            <p className="mb-3 text-sm font-semibold text-text-primary">
              {producto.nombre}
            </p>
            <ul className="space-y-3 pl-6">
              {variantesOrdenadas(producto).map((variante) => {
                  const cantidad =
                    ventasVariantes.find((v) => v.variante_id === variante.id)
                      ?.cantidad ?? 0
                  const subtotal = cantidad * variante.precio
                  return (
                    <li
                      key={variante.id}
                      className="border-t border-bg-border pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-text-primary">
                            {variante.nombre}
                          </p>
                          <p className="text-xs text-text-secondary tabular-nums">
                            {formatPesos(variante.precio)}
                          </p>
                        </div>
                        {esAdmin && subtotal > 0 && (
                          <span className="shrink-0 text-xs font-semibold text-accent-green tabular-nums">
                            {formatPesos(subtotal)}
                          </span>
                        )}
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                          Cantidad
                        </span>
                        <CeldaNumero
                          value={cantidad || ''}
                          placeholder="0"
                          disabled={disabled}
                          className="h-10 min-w-0 text-base"
                          onChange={(e) =>
                            onVarianteChange(
                              variante.id,
                              Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                        />
                      </label>
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
              className="rounded-[var(--radius-md)] border border-bg-border bg-bg-surface p-3.5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {producto.nombre}
                  </p>
                  {producto.descripcion && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      {producto.descripcion}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-secondary tabular-nums">
                    {producto.precio != null
                      ? formatPesos(producto.precio)
                      : '—'}
                  </p>
                </div>
                {esAdmin && subtotal > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-accent-green tabular-nums">
                    {formatPesos(subtotal)}
                  </span>
                )}
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                  Cantidad
                </span>
                <CeldaNumero
                  value={cantidad || ''}
                  placeholder="0"
                  disabled={disabled}
                  className="h-10 min-w-0 text-base"
                  onChange={(e) =>
                    onComidaChange(
                      producto.id,
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                />
              </label>
            </li>
          )
        })}
      </ul>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto rounded-[var(--radius-md)] border border-bg-border md:block">
        <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-bg-border bg-bg-elevated/60">
              <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Producto / Variante
              </th>
              <th className="w-20 px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Precio
              </th>
              <th className="w-20 px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Cantidad
              </th>
              {esAdmin && (
                <th className="w-24 px-2 py-1.5 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Total
                </th>
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
                      className="px-2 py-1.5 text-xs font-semibold text-text-secondary"
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
                      <tr
                        key={variante.id}
                        className="border-t border-bg-border/80 hover:bg-bg-elevated/30"
                      >
                        <td className="px-2 py-1.5 pl-6 text-sm text-text-primary">
                          {variante.nombre}
                        </td>
                        <td className="px-2 py-1.5 text-center text-xs text-text-secondary tabular-nums">
                          {formatPesos(variante.precio)}
                        </td>
                        <td className="px-1.5 py-1">
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
                          <td className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums">
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
                <tr
                  key={producto.id}
                  className="border-t border-bg-border/80 hover:bg-bg-elevated/30"
                >
                  <td className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-text-primary">
                      {producto.nombre}
                    </p>
                    {producto.descripcion && (
                      <p className="text-xs text-text-muted">
                        {producto.descripcion}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center text-xs text-text-secondary tabular-nums">
                    {producto.precio != null
                      ? formatPesos(producto.precio)
                      : '—'}
                  </td>
                  <td className="px-1.5 py-1">
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
                    <td className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums">
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
