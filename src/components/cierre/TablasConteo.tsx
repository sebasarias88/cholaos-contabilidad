'use client'

import type { ReactNode } from 'react'
import {
  CeldaNumero,
  celdaConteoMobile,
  displayCantidad,
  parseCantidad,
  TablaConteoShell,
} from '@/components/cierre/ConteoTabla'
import {
  desgloseCuadra,
  sumaDesglose,
  totalNovedades,
  vendidosReales,
} from '@/lib/ventas-desde-vasos'
import { formatPesos, formatTalla } from '@/lib/utils'
import type {
  ConteoProductoValor,
  ConteoVasoValor,
  Producto,
  TallaVaso,
} from '@/types'

type VasoRow = ConteoVasoValor & {
  talla_id: string
  talla?: TallaVaso
}

type ProductoRow = ConteoProductoValor & {
  producto_id: string
  producto: Producto
}

const celdaMobile = celdaConteoMobile

function nombreVaso(talla: Pick<TallaVaso, 'onzas' | 'descripcion' | 'tipo'>) {
  if (talla.descripcion) {
    return `${talla.descripcion} · ${formatTalla(talla)}`
  }
  return formatTalla(talla)
}

function CampoConteo({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      {children}
    </label>
  )
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-[var(--radius-md)] border border-bg-border bg-bg-surface p-3">
      {children}
    </li>
  )
}

function DesgloseProductos({
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
      <p className="mt-2 text-xs text-accent-red">
        Sin productos ligados a este vaso. Asócialos en Productos.
      </p>
    )
  }

  if (productos.length === 1) {
    const p = productos[0]
    return (
      <p className="mt-2 text-xs text-text-secondary">
        Todo lo vendido →{' '}
        <span className="font-medium text-text-primary">{p.nombre}</span>
        {esAdmin && p.precio != null && p.precio > 0 && (
          <span className="tabular-nums"> · {formatPesos(p.precio)}</span>
        )}
      </p>
    )
  }

  const suma = sumaDesglose(desglose)
  const ok = vendidos === 0 || suma === vendidos

  return (
    <div className="mt-3 space-y-2 border-t border-bg-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
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
          const qty =
            desglose.find((d) => d.producto_id === p.id)?.cantidad ?? 0
          return (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-text-primary">
                  {p.nombre}
                </p>
                {esAdmin && p.precio != null && (
                  <p className="text-[10px] text-text-secondary tabular-nums">
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
                  onDesgloseChange(
                    tallaId,
                    p.id,
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface TablaVasosProps {
  rows: VasoRow[]
  esAdmin: boolean
  disabled?: boolean
  onChange: <K extends keyof ConteoVasoValor>(
    tallaId: string,
    campo: K,
    valor: ConteoVasoValor[K]
  ) => void
  onDesgloseChange: (
    tallaId: string,
    productoId: string,
    cantidad: number
  ) => void
  onAbrirNovedades: (tallaId: string) => void
  productosPorTalla: Record<string, Producto[]>
}

export function TablaVasos({
  rows,
  esAdmin,
  disabled = false,
  onChange,
  onDesgloseChange,
  onAbrirNovedades,
  productosPorTalla,
}: TablaVasosProps) {
  return (
    <>
      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const vendidos = vendidosReales(row)
          const novTotal = totalNovedades(row)
          const productos = productosPorTalla[row.talla_id] ?? []
          const titulo = nombreVaso({
            onzas: row.talla?.onzas ?? 0,
            descripcion: row.talla?.descripcion ?? productos[0]?.nombre,
            tipo: row.talla?.tipo ?? 'normal',
          })
          const cuadra = desgloseCuadra(row) || productos.length <= 1

          return (
            <CardShell key={row.talla_id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {titulo}
                  </p>
                  {productos.length > 1 && (
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {productos.length} productos en este vaso
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAbrirNovedades(row.talla_id)}
                  className={[
                    'h-8 shrink-0 rounded-[var(--radius-md)] border px-2.5 text-xs font-medium transition-colors',
                    novTotal > 0
                      ? 'border-accent-amber/40 bg-accent-amber/15 text-accent-amber'
                      : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-accent-amber/40 hover:text-accent-amber',
                    disabled ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  {novTotal > 0 ? `Nov. ${novTotal}` : 'Nov.'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <CampoConteo label="Inicio">
                  <CeldaNumero
                    readonly
                    value={row.cantidad_inicio}
                    disabled={disabled}
                    className={celdaMobile}
                  />
                </CampoConteo>
                <CampoConteo label="+Nuevos">
                  <CeldaNumero
                    value={displayCantidad(row.cantidad_nuevos, true)}
                    placeholder="0"
                    disabled={disabled}
                    className={celdaMobile}
                    onChange={(e) =>
                      onChange(
                        row.talla_id,
                        'cantidad_nuevos',
                        parseCantidad(e.target.value)
                      )
                    }
                  />
                </CampoConteo>
                <CampoConteo label="Final">
                  <CeldaNumero
                    value={displayCantidad(row.cantidad_final, true)}
                    placeholder="0"
                    disabled={disabled}
                    className={celdaMobile}
                    onChange={(e) =>
                      onChange(
                        row.talla_id,
                        'cantidad_final',
                        parseCantidad(e.target.value)
                      )
                    }
                  />
                </CampoConteo>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-bg-border pt-2">
                <span className="text-xs text-text-secondary">Vendidos</span>
                <span
                  className={[
                    'tabular-nums text-sm font-semibold',
                    vendidos > 0
                      ? cuadra
                        ? 'text-accent-cyan'
                        : 'text-accent-red'
                      : 'text-text-muted',
                  ].join(' ')}
                >
                  {vendidos}
                </span>
              </div>

              <DesgloseProductos
                tallaId={row.talla_id}
                productos={productos}
                desglose={row.desglose}
                vendidos={vendidos}
                esAdmin={esAdmin}
                disabled={disabled}
                onDesgloseChange={onDesgloseChange}
              />
            </CardShell>
          )
        })}
      </ul>

      {/* Desktop: tabla + desglose debajo de cada fila */}
      <div className="hidden min-w-0 max-w-full space-y-3 md:block">
        {rows.map((row) => {
          const vendidos = vendidosReales(row)
          const novTotal = totalNovedades(row)
          const productos = productosPorTalla[row.talla_id] ?? []
          const titulo = nombreVaso({
            onzas: row.talla?.onzas ?? 0,
            descripcion: row.talla?.descripcion ?? productos[0]?.nombre,
            tipo: row.talla?.tipo ?? 'normal',
          })
          const cuadra = desgloseCuadra(row) || productos.length <= 1

          return (
            <div
              key={row.talla_id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-bg-border bg-bg-surface"
            >
              <div className="table-scroll-wrap min-w-0 max-w-full overflow-x-auto">
                <table className="data-table text-sm">
                  <thead>
                    <tr className="border-b border-bg-border bg-bg-elevated/60">
                      <th className="col-name text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Vaso físico
                      </th>
                      <th className="col-compact w-16 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Inicio
                      </th>
                      <th className="col-compact w-16 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        +Nuevos
                      </th>
                      <th className="col-compact w-16 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Final
                      </th>
                      <th className="col-compact w-14 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Vend.
                      </th>
                      <th className="col-compact w-14 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Nov.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-bg-border">
                      <td className="col-name">
                        <p className="text-sm font-semibold text-text-primary">
                          {titulo}
                        </p>
                        {productos.length > 1 && (
                          <p className="text-xs text-text-muted">
                            {productos.length} productos
                          </p>
                        )}
                      </td>
                      <td className="col-compact min-w-[4.5rem]">
                        <CeldaNumero
                          readonly
                          value={row.cantidad_inicio}
                          disabled={disabled}
                        />
                      </td>
                      <td className="col-compact min-w-[4.5rem]">
                        <CeldaNumero
                          value={displayCantidad(row.cantidad_nuevos, true)}
                          placeholder="0"
                          disabled={disabled}
                          onChange={(e) =>
                            onChange(
                              row.talla_id,
                              'cantidad_nuevos',
                              parseCantidad(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="col-compact min-w-[4.5rem]">
                        <CeldaNumero
                          value={displayCantidad(row.cantidad_final, true)}
                          placeholder="0"
                          disabled={disabled}
                          onChange={(e) =>
                            onChange(
                              row.talla_id,
                              'cantidad_final',
                              parseCantidad(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="col-compact min-w-[3.5rem] text-center">
                        <span
                          className={[
                            'tabular-nums text-xs font-semibold',
                            vendidos > 0
                              ? cuadra
                                ? 'text-accent-cyan'
                                : 'text-accent-red'
                              : 'text-text-muted',
                          ].join(' ')}
                        >
                          {vendidos}
                        </span>
                      </td>
                      <td className="col-compact min-w-[3.5rem] text-center">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onAbrirNovedades(row.talla_id)}
                          className={[
                            'h-7 min-w-[2.5rem] rounded border px-1.5 text-[11px] font-medium transition-colors',
                            novTotal > 0
                              ? 'border-accent-amber/40 bg-accent-amber/15 text-accent-amber'
                              : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-accent-amber/40 hover:text-accent-amber',
                            disabled ? 'opacity-50' : '',
                          ].join(' ')}
                        >
                          {novTotal > 0 ? novTotal : 'Nov.'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-3">
                <DesgloseProductos
                  tallaId={row.talla_id}
                  productos={productos}
                  desglose={row.desglose}
                  vendidos={vendidos}
                  esAdmin={esAdmin}
                  disabled={disabled}
                  onDesgloseChange={onDesgloseChange}
                />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

interface TablaProductosProps {
  rows: ProductoRow[]
  esAdmin: boolean
  disabled?: boolean
  modo: 'comida' | 'insumo'
  onChange: <K extends keyof ConteoProductoValor>(
    productoId: string,
    campo: K,
    valor: ConteoProductoValor[K]
  ) => void
}

function resultadoProducto(row: ConteoProductoValor) {
  if (row.cantidad_final === null) return 0
  return Math.max(
    0,
    row.cantidad_inicio + (row.cantidad_nuevos ?? 0) - row.cantidad_final
  )
}

export function TablaProductos({
  rows,
  esAdmin,
  disabled = false,
  modo,
  onChange,
}: TablaProductosProps) {
  const colResultado = modo === 'comida' ? 'Vend.' : 'Cons.'
  const labelResultado = modo === 'comida' ? 'Vendidos' : 'Consumidos'

  return (
    <>
      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const res = resultadoProducto(row)
          const unidad = row.producto.unidad ?? '—'

          return (
            <CardShell key={row.producto_id}>
              <div className="mb-2 min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {row.producto.nombre}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {unidad}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <CampoConteo label="Inicio">
                  <CeldaNumero
                    readonly
                    value={row.cantidad_inicio}
                    disabled={disabled}
                    className={celdaMobile}
                  />
                </CampoConteo>
                <CampoConteo label="+Nuevos">
                  <CeldaNumero
                    value={displayCantidad(row.cantidad_nuevos, true)}
                    placeholder="0"
                    disabled={disabled}
                    className={celdaMobile}
                    onChange={(e) =>
                      onChange(
                        row.producto_id,
                        'cantidad_nuevos',
                        parseCantidad(e.target.value)
                      )
                    }
                  />
                </CampoConteo>
                <CampoConteo label="Final">
                  <CeldaNumero
                    value={displayCantidad(row.cantidad_final, true)}
                    placeholder="0"
                    disabled={disabled}
                    className={celdaMobile}
                    onChange={(e) =>
                      onChange(
                        row.producto_id,
                        'cantidad_final',
                        parseCantidad(e.target.value)
                      )
                    }
                  />
                </CampoConteo>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-bg-border pt-2">
                <span className="text-xs text-text-secondary">{labelResultado}</span>
                <span
                  className={[
                    'tabular-nums text-sm font-semibold',
                    res > 0
                      ? modo === 'comida'
                        ? 'text-accent-green'
                        : 'text-text-secondary'
                      : 'text-text-muted',
                  ].join(' ')}
                >
                  {res}
                </span>
              </div>
            </CardShell>
          )
        })}
      </ul>

      {/* Desktop: tabla */}
      <div className="hidden min-w-0 max-w-full md:block">
        <TablaConteoShell
          columns={[
            { key: 'nombre', label: 'Producto', className: 'min-w-[9rem]' },
            { key: 'unidad', label: 'Unidad', className: 'w-16' },
            { key: 'inicio', label: 'Inicio', className: 'w-16 text-center' },
            { key: 'nuevos', label: '+Nuevos', className: 'w-16 text-center' },
            { key: 'final', label: 'Final', className: 'w-16 text-center' },
            { key: 'res', label: colResultado, className: 'w-14 text-center' },
          ]}
        >
          {rows.map((row) => {
            const res = resultadoProducto(row)
            const precio = row.producto.precio ?? 0

            return (
              <tr
                key={row.producto_id}
                className="border-t border-bg-border hover:bg-bg-elevated/30"
              >
                <td className="col-name">
                  <p className="text-sm font-semibold text-text-primary">
                    {row.producto.nombre}
                  </p>
                  {modo === 'comida' && esAdmin && precio > 0 && (
                    <p className="text-xs font-medium text-text-primary/90 tabular-nums">
                      {formatPesos(precio)} c/u
                      {res > 0 ? ` · ${formatPesos(res * precio)}` : ''}
                    </p>
                  )}
                </td>
                <td className="col-compact min-w-[4.5rem] text-xs text-text-secondary">
                  {row.producto.unidad ?? '—'}
                </td>
                <td className="col-compact min-w-[4.5rem]">
                  <CeldaNumero
                    readonly
                    value={row.cantidad_inicio}
                    disabled={disabled}
                  />
                </td>
                <td className="col-compact min-w-[4.5rem]">
                  <CeldaNumero
                    value={displayCantidad(row.cantidad_nuevos, true)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(
                        row.producto_id,
                        'cantidad_nuevos',
                        parseCantidad(e.target.value)
                      )
                    }
                  />
                </td>
                <td className="col-compact min-w-[4.5rem]">
                  <CeldaNumero
                    value={displayCantidad(row.cantidad_final, true)}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(
                        row.producto_id,
                        'cantidad_final',
                        parseCantidad(e.target.value)
                      )
                    }
                  />
                </td>
                <td className="col-compact min-w-[3.5rem] text-center">
                  <span
                    className={[
                      'tabular-nums text-xs font-semibold',
                      res > 0
                        ? modo === 'comida'
                          ? 'text-accent-green'
                          : 'text-text-secondary'
                        : 'text-text-muted',
                    ].join(' ')}
                  >
                    {res}
                  </span>
                </td>
              </tr>
            )
          })}
        </TablaConteoShell>
      </div>
    </>
  )
}
