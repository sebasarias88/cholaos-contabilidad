'use client'

import { Fragment, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search, Receipt } from 'lucide-react'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { FiltroRango } from '@/components/ui/FiltroRango'
import { NumeroAnimado } from '@/components/ui/NumeroAnimado'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { useApiGet } from '@/hooks/useApiGet'
import { useRangoFechas } from '@/hooks/useRangoFechas'
import { fadeUp } from '@/lib/animations'
import { formatFecha, formatPesos } from '@/lib/utils'
import type { DetalleVenta, Rol, Venta } from '@/types'

function resumenCantidades(venta: Venta) {
  let vasos = 0
  let comida = 0
  for (const d of venta.detalle ?? []) {
    if ((d.origen ?? 'vaso') === 'vaso') vasos += d.cantidad
    else comida += d.cantidad
  }
  return { vasos, comida }
}

function etiquetaCantidades(venta: Venta) {
  const { vasos, comida } = resumenCantidades(venta)
  const partes: string[] = []
  if (vasos > 0) partes.push(`${vasos} vaso${vasos === 1 ? '' : 's'}`)
  if (comida > 0) partes.push(`${comida} comida`)
  return partes.length > 0 ? partes.join(' · ') : 'Sin ítems'
}

function etiquetaTipo(d: DetalleVenta) {
  if (d.origen === 'variante') return 'Variante'
  if (d.origen === 'comida' || d.producto?.tipo === 'comida') return 'Comida'
  return 'Vaso'
}

function medidaLinea(d: DetalleVenta) {
  if ((d.origen ?? 'vaso') === 'vaso' && d.producto?.onzas) {
    return `${d.producto.onzas} oz`
  }
  return d.producto?.unidad ?? '—'
}

function RolBadge({ rol }: { rol: Rol }) {
  return (
    <span className={rol === 'admin' ? 'badge-brand shrink-0' : 'badge-green shrink-0'}>
      {rol === 'admin' ? 'Admin' : 'Empleado'}
    </span>
  )
}

function VentaDetallePanel({ venta }: { venta: Venta }) {
  if (!venta.detalle?.length) {
    return <p className="text-text-muted text-sm">Sin detalle de productos.</p>
  }

  return (
    <ul className="divide-bg-border/60 divide-y">
      {venta.detalle.map((d) => (
        <li key={d.id} className="py-3 first:pt-0 last:pb-0">
          <p className="text-text-primary font-medium">{d.producto?.nombre ?? '—'}</p>
          <p className="text-text-muted mt-0.5 text-xs">
            {etiquetaTipo(d)}
            {medidaLinea(d) !== '—' ? ` · ${medidaLinea(d)}` : ''}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-text-muted">Cantidad</dt>
            <dd className="text-text-primary text-right tabular-nums">{d.cantidad}</dd>
            <dt className="text-text-muted">Precio unit.</dt>
            <dd className="text-text-secondary text-right tabular-nums">
              {formatPesos(d.precio_unitario)}
            </dd>
            <dt className="text-text-muted">Subtotal</dt>
            <dd className="text-brand text-right font-medium tabular-nums">
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
        'focus-ring text-text-secondary hover:bg-bg-elevated hover:text-text-primary inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)]',
        compacto ? 'p-1.5' : 'min-h-11 min-w-11',
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
    return <p className="text-text-muted text-sm">Sin detalle de productos.</p>
  }

  return (
    <div className="table-scroll-wrap max-w-full min-w-0 overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="col-name">Producto</th>
            <th className="col-compact min-w-[5.5rem]">Tipo</th>
            <th className="col-compact min-w-[4.5rem]">Cantidad</th>
            <th className="col-compact min-w-[6rem]">Precio unit.</th>
            <th className="col-compact min-w-[6rem] text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {venta.detalle.map((d) => (
            <tr key={d.id}>
              <td className="col-name text-text-primary">
                {d.producto?.nombre ?? '—'}
                {medidaLinea(d) !== '—' && (
                  <span className="text-text-muted mt-0.5 block text-xs">{medidaLinea(d)}</span>
                )}
              </td>
              <td className="col-compact text-text-secondary">{etiquetaTipo(d)}</td>
              <td className="col-compact tabular-nums">{d.cantidad}</td>
              <td className="col-compact text-text-secondary tabular-nums">
                {formatPesos(d.precio_unitario)}
              </td>
              <td className="col-compact text-brand text-right font-medium tabular-nums">
                {formatPesos(d.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function HistorialVentas() {
  const filtro = useRangoFechas('hoy')
  const { rango, completo } = filtro
  const { data, loading } = useApiGet<Venta[]>(
    completo ? `/api/ventas?desde=${rango.desde}&hasta=${rango.hasta}` : null
  )
  const ventas = useMemo(() => data ?? [], [data])
  const [busqueda, setBusqueda] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const ventasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return ventas
    return ventas.filter((v) => {
      const nombre = (v.usuario?.nombre ?? '').toLowerCase()
      const fechaFmt = formatFecha(v.fecha).toLowerCase()
      return (
        nombre.includes(q) ||
        fechaFmt.includes(q) ||
        v.fecha.includes(q) ||
        (v.detalle ?? []).some((d) => (d.producto?.nombre ?? '').toLowerCase().includes(q))
      )
    })
  }, [ventas, busqueda])

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
        <FiltroRango filtro={filtro} idPrefix="ventas" />

        <div className="relative w-full min-w-0 sm:max-w-md">
          <Search
            size={18}
            className="text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar por fecha, empleado o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="select-field select-field--with-icon w-full min-w-0"
          />
        </div>
      </div>

      {loading && !data ? (
        <SkeletonTabla filas={8} />
      ) : ventasFiltradas.length === 0 ? (
        <EstadoVacio
          icono={<Receipt size={26} aria-hidden />}
          titulo={busqueda ? 'Nada coincide con tu búsqueda' : 'No hay ventas en este período'}
          descripcion={
            busqueda ? 'Prueba con otro nombre o producto.' : 'Elige otro rango de fechas.'
          }
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cocoa text-cocoa-text flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-5 py-4"
          >
            <span className="text-cocoa-muted text-sm font-semibold">
              {ventasFiltradas.length} venta{ventasFiltradas.length !== 1 ? 's' : ''}
              {busqueda ? ' encontradas' : ' en el período'}
            </span>
            <NumeroAnimado
              valor={ventasFiltradas.reduce((acc, v) => acc + Number(v.total), 0)}
              formato="pesos"
              className="font-display text-2xl font-extrabold"
            />
          </motion.div>

          {/* Vista móvil: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {ventasFiltradas.map((venta) => {
              const abierta = expandedId === venta.id
              return (
                <li key={venta.id} className="card overflow-hidden">
                  <div className="flex items-start gap-2 p-4">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => toggleExpand(venta.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-text-primary text-sm leading-snug font-medium">
                          {formatFecha(venta.fecha)}
                        </p>
                        <p className="text-brand shrink-0 text-base font-semibold tabular-nums">
                          {formatPesos(venta.total)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-text-secondary max-w-full truncate text-sm">
                          {venta.usuario?.nombre ?? '—'}
                        </span>
                        {venta.usuario?.rol && <RolBadge rol={venta.usuario.rol} />}
                        <span className="badge-brand tabular-nums">
                          {etiquetaCantidades(venta)}
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
                        className="border-bg-border bg-bg-elevated/30 overflow-hidden border-t"
                      >
                        <div className="px-4 py-4">
                          <VentaDetallePanel venta={venta} />
                          {venta.observaciones && (
                            <p className="border-bg-border/50 text-text-secondary mt-3 border-t pt-3 text-sm">
                              <span className="text-text-primary font-medium">Nota:</span>{' '}
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
          <div className="table-surface table-surface--expandable hidden max-w-full min-w-0 md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-compact min-w-[7rem]">Fecha</th>
                  <th className="col-name min-w-[8rem]">Empleado</th>
                  <th className="col-compact min-w-[8rem]">Detalle</th>
                  <th className="col-compact min-w-[6.5rem]">Total</th>
                  <th className="col-compact min-w-[5rem] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((venta) => {
                  const abierta = expandedId === venta.id
                  const colSpan = 5
                  return (
                    <Fragment key={venta.id}>
                      <tr
                        className="border-bg-border transition-surface hover:bg-bg-elevated/50 cursor-pointer border-t"
                        onClick={() => toggleExpand(venta.id)}
                      >
                        <td className="col-compact text-text-primary">
                          {formatFecha(venta.fecha)}
                        </td>
                        <td className="col-name">
                          <span className="inline-flex flex-wrap items-center gap-1">
                            <span className="text-text-secondary">
                              {venta.usuario?.nombre ?? '—'}
                            </span>
                            {venta.usuario?.rol && <RolBadge rol={venta.usuario.rol} />}
                          </span>
                        </td>
                        <td className="col-compact">
                          <span className="badge-brand tabular-nums">
                            {etiquetaCantidades(venta)}
                          </span>
                        </td>
                        <td className="col-compact text-brand font-medium tabular-nums">
                          {formatPesos(venta.total)}
                        </td>
                        <td className="col-compact text-right">
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
                          <td colSpan={colSpan} className="border-bg-border border-t p-0">
                            <div className="px-4 py-4">
                              <VentaDetalleTabla venta={venta} />
                              {venta.observaciones && (
                                <p className="text-text-secondary mt-3 text-sm">
                                  <span className="text-text-primary font-medium">Nota:</span>{' '}
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
