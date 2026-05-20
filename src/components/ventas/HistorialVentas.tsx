'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { formatFecha, formatPesos, getRangoFecha } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Rol, Venta } from '@/types'

type RangoPreset = 'hoy' | 'semana' | 'quincena' | 'mes' | 'custom'

const RANGOS: { id: RangoPreset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'quincena', label: 'Quincena' },
  { id: 'mes', label: 'Este mes' },
]

interface HistorialVentasProps {
  usuarioId: string
  rol: Rol
}

function totalVasos(venta: Venta) {
  return venta.detalle?.reduce((acc, d) => acc + d.cantidad, 0) ?? 0
}

function RolBadge({ rol }: { rol: Rol }) {
  return (
    <span
      className={
        rol === 'admin' ? 'badge-cyan shrink-0' : 'badge-green shrink-0'
      }
    >
      {rol === 'admin' ? 'Admin' : 'Empleado'}
    </span>
  )
}

function VentaDetallePanel({ venta }: { venta: Venta }) {
  if (!venta.detalle?.length) {
    return (
      <p className="text-sm text-text-muted">Sin detalle de productos.</p>
    )
  }

  return (
    <ul className="divide-y divide-bg-border/60">
      {venta.detalle.map((d) => (
        <li key={d.id} className="py-3 first:pt-0 last:pb-0">
          <p className="font-medium text-text-primary">
            {d.producto?.nombre ?? '—'}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-text-muted">Onzas</dt>
            <dd className="text-right text-text-secondary tabular-nums">
              {d.producto?.onzas ?? '—'} oz
            </dd>
            <dt className="text-text-muted">Cantidad</dt>
            <dd className="text-right text-text-primary tabular-nums">
              {d.cantidad}
            </dd>
            <dt className="text-text-muted">Precio unit.</dt>
            <dd className="text-right text-text-secondary tabular-nums">
              {formatPesos(d.precio_unitario)}
            </dd>
            <dt className="text-text-muted">Subtotal</dt>
            <dd className="text-right font-medium text-accent-cyan tabular-nums">
              {formatPesos(d.subtotal)}
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function BotonExpandir({
  abierta,
  onToggle,
  compacto = false,
}: {
  abierta: boolean
  onToggle: (e: React.MouseEvent) => void
  compacto?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={abierta ? 'Ocultar detalle' : 'Ver detalle'}
      aria-expanded={abierta}
      className={[
        'focus-ring-cyan inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        compacto
          ? 'p-1.5'
          : 'min-h-11 min-w-11',
      ].join(' ')}
      onClick={onToggle}
    >
      <ChevronDown
        size={compacto ? 18 : 20}
        className={`transition-transform ${abierta ? 'rotate-180' : ''}`}
      />
    </button>
  )
}

/** Detalle en tabla (escritorio) */
function VentaDetalleTabla({ venta }: { venta: Venta }) {
  if (!venta.detalle?.length) {
    return (
      <p className="text-sm text-text-muted">Sin detalle de productos.</p>
    )
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-text-secondary">
          <th className="pb-2 pr-4 font-medium">Producto</th>
          <th className="pb-2 pr-4 font-medium">Onzas</th>
          <th className="pb-2 pr-4 font-medium">Cantidad</th>
          <th className="pb-2 pr-4 font-medium">Precio unit.</th>
          <th className="pb-2 font-medium text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {venta.detalle.map((d) => (
          <tr key={d.id} className="border-t border-bg-border/50">
            <td className="py-2 pr-4 text-text-primary">
              {d.producto?.nombre ?? '—'}
            </td>
            <td className="py-2 pr-4 text-text-secondary tabular-nums">
              {d.producto?.onzas ?? '—'} oz
            </td>
            <td className="py-2 pr-4 tabular-nums">{d.cantidad}</td>
            <td className="py-2 pr-4 text-text-secondary tabular-nums">
              {formatPesos(d.precio_unitario)}
            </td>
            <td className="py-2 text-right font-medium text-accent-cyan tabular-nums">
              {formatPesos(d.subtotal)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function HistorialVentas({ usuarioId, rol }: HistorialVentasProps) {
  const [preset, setPreset] = useState<RangoPreset>('hoy')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rango = useMemo(() => {
    if (preset === 'custom') {
      if (customDesde && customHasta) {
        return { desde: customDesde, hasta: customHasta }
      }
      return getRangoFecha('hoy')
    }
    return getRangoFecha(preset)
  }, [preset, customDesde, customHasta])

  const cargarVentas = useCallback(() => {
    setLoading(true)
    setExpandedId(null)
    fetch(`/api/ventas?desde=${rango.desde}&hasta=${rango.hasta}`)
      .then((r) => r.json())
      .then((data: Venta[]) => setVentas(data))
      .catch(() => toast.error('Error cargando ventas'))
      .finally(() => setLoading(false))
  }, [rango.desde, rango.hasta])

  useEffect(() => {
    if (preset === 'custom' && (!customDesde || !customHasta)) return
    cargarVentas()
  }, [cargarVentas, preset, customDesde, customHasta])

  const ventasFiltradas = useMemo(() => {
    let list = ventas
    if (rol === 'empleado') {
      list = list.filter((v) => v.usuario_id === usuarioId)
    }
    const q = busqueda.trim().toLowerCase()
    if (!q) return list
    return list.filter((v) => {
      const nombre = (v.usuario?.nombre ?? '').toLowerCase()
      const fechaFmt = formatFecha(v.fecha).toLowerCase()
      return (
        nombre.includes(q) ||
        fechaFmt.includes(q) ||
        v.fecha.includes(q)
      )
    })
  }, [ventas, rol, usuarioId, busqueda])

  const mostrarEmpleado = rol === 'admin'

  function seleccionarPreset(id: RangoPreset) {
    setPreset(id)
    if (id !== 'custom') {
      setCustomDesde('')
      setCustomHasta('')
    } else {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      setCustomDesde((d) => d || hoy)
      setCustomHasta((h) => h || hoy)
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-5 sm:gap-6"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
          <div className="flex w-max min-w-full flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
            {RANGOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => seleccionarPreset(r.id)}
                className={
                  preset === r.id
                    ? 'filter-pill filter-pill-active shrink-0'
                    : 'filter-pill filter-pill-inactive shrink-0'
                }
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => seleccionarPreset('custom')}
              className={
                preset === 'custom'
                  ? 'filter-pill filter-pill-active shrink-0'
                  : 'filter-pill filter-pill-inactive shrink-0'
              }
            >
              Personalizado
            </button>
          </div>
        </div>

        {preset === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid gap-3 rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface p-4 sm:grid-cols-2 sm:items-end"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="desde" className="text-sm text-text-secondary">
                Desde
              </label>
              <input
                id="desde"
                type="date"
                value={customDesde}
                onChange={(e) => setCustomDesde(e.target.value)}
                className="select-field w-full min-w-0"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="hasta" className="text-sm text-text-secondary">
                Hasta
              </label>
              <input
                id="hasta"
                type="date"
                value={customHasta}
                min={customDesde}
                onChange={(e) => setCustomHasta(e.target.value)}
                className="select-field w-full min-w-0"
              />
            </div>
          </motion.div>
        )}

        <div className="relative w-full min-w-0 sm:max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar por fecha o empleado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="select-field select-field--with-icon w-full min-w-0"
          />
        </div>

        {rol === 'empleado' && (
          <p className="text-sm text-text-secondary">
            Mostrando solo tus ventas.
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonTabla filas={8} />
      ) : ventasFiltradas.length === 0 ? (
        <p className="text-sm text-text-muted">
          No hay ventas en este período.
        </p>
      ) : (
        <>
          {/* Vista móvil: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {ventasFiltradas.map((venta) => {
              const abierta = expandedId === venta.id
              return (
                <li
                  key={venta.id}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface"
                >
                  <div className="flex items-start gap-2 p-4">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => toggleExpand(venta.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug text-text-primary">
                          {formatFecha(venta.fecha)}
                        </p>
                        <p className="shrink-0 text-base font-semibold text-accent-cyan tabular-nums">
                          {formatPesos(venta.total)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {mostrarEmpleado && (
                          <span className="max-w-full truncate text-sm text-text-secondary">
                            {venta.usuario?.nombre ?? '—'}
                          </span>
                        )}
                        {mostrarEmpleado && venta.usuario?.rol && (
                          <RolBadge rol={venta.usuario.rol} />
                        )}
                        <span className="badge-cyan tabular-nums">
                          {totalVasos(venta)} vasos
                        </span>
                      </div>
                    </button>
                    <BotonExpandir
                      abierta={abierta}
                      onToggle={(e) => {
                        e.stopPropagation()
                        toggleExpand(venta.id)
                      }}
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {abierta && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-bg-border bg-bg-elevated/30"
                      >
                        <div className="px-4 py-4">
                          <VentaDetallePanel venta={venta} />
                          {venta.observaciones && (
                            <p className="mt-3 border-t border-bg-border/50 pt-3 text-sm text-text-secondary">
                              <span className="font-medium text-text-primary">
                                Nota:
                              </span>{' '}
                              {venta.observaciones}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>

          {/* Vista escritorio: tabla */}
          <div className="table-surface table-surface--expandable hidden md:block">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  {mostrarEmpleado && (
                    <th className="px-4 py-3">Empleado</th>
                  )}
                  <th className="px-4 py-3">Vasos</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((venta) => {
                  const abierta = expandedId === venta.id
                  const colSpan = mostrarEmpleado ? 5 : 4
                  return (
                    <Fragment key={venta.id}>
                      <tr
                        className="cursor-pointer border-t border-bg-border transition-surface hover:bg-bg-elevated/50"
                        onClick={() => toggleExpand(venta.id)}
                      >
                        <td className="px-4 py-3 text-text-primary">
                          {formatFecha(venta.fecha)}
                        </td>
                        {mostrarEmpleado && (
                          <td className="px-4 py-3">
                            <span className="inline-flex flex-wrap items-center gap-1">
                              <span className="text-text-secondary">
                                {venta.usuario?.nombre ?? '—'}
                              </span>
                              {venta.usuario?.rol && (
                                <RolBadge rol={venta.usuario.rol} />
                              )}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="badge-cyan tabular-nums">
                            {totalVasos(venta)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-accent-cyan tabular-nums">
                          {formatPesos(venta.total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <BotonExpandir
                            abierta={abierta}
                            compacto
                            onToggle={(e) => {
                              e.stopPropagation()
                              toggleExpand(venta.id)
                            }}
                          />
                        </td>
                      </tr>
                      {abierta && (
                        <tr className="bg-bg-elevated/30">
                          <td
                            colSpan={colSpan}
                            className="border-t border-bg-border p-0"
                          >
                            <div className="px-4 py-4">
                              <VentaDetalleTabla venta={venta} />
                              {venta.observaciones && (
                                <p className="mt-3 text-sm text-text-secondary">
                                  <span className="font-medium text-text-primary">
                                    Nota:
                                  </span>{' '}
                                  {venta.observaciones}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  )
}
