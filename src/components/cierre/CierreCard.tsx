'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Pencil,
  XCircle,
} from 'lucide-react'
import {
  getDiferenciaCierre,
  getEstadoCuadre,
  mergeProductosVendidos,
  totalVasosGastadosCierre,
  type ProductoVendidoHistorial,
} from '@/lib/cierre-historial'
import { formatFecha, formatPesos, formatTalla } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CierreDia, ConteoVaso, Venta } from '@/types'

type TabHistorial = 'resumen' | 'productos' | 'vasos' | 'gastos'

const TABS: { id: TabHistorial; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'productos', label: 'Productos' },
  { id: 'vasos', label: 'Vasos' },
  { id: 'gastos', label: 'Movimientos' },
]

function TabResumen({
  cierre,
  esAdmin,
}: {
  cierre: CierreDia
  esAdmin: boolean
}) {
  const diferencia = getDiferenciaCierre(cierre)
  const esperado =
    cierre.efectivo_esperado ??
    cierre.dinero_base_inicio +
      cierre.total_ventas -
      cierre.total_transferencias -
      cierre.total_gastos -
      (cierre.total_domicilios ?? 0)

  const movimientos = [
    {
      label: 'Base inicio',
      value: formatPesos(cierre.dinero_base_inicio),
      color: 'text-text-primary',
    },
    {
      label: 'Ventas',
      value: formatPesos(cierre.total_ventas),
      color: 'text-accent-cyan',
    },
    {
      label: 'Gastos',
      value: formatPesos(cierre.total_gastos),
      color: 'text-accent-red',
    },
    {
      label: 'Transferencias',
      value: formatPesos(cierre.total_transferencias),
      color: 'text-amber-400',
    },
    {
      label: 'Domicilios',
      value: formatPesos(cierre.total_domicilios ?? 0),
      color: 'text-orange-400',
    },
  ]

  const textoDiferencia =
    diferencia === 0
      ? 'Cuadre exacto'
      : diferencia < 0
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : `Sobran ${formatPesos(diferencia)}`

  const colorDiferencia =
    diferencia === 0
      ? 'text-emerald-400'
      : diferencia < 0
        ? 'text-accent-red'
        : 'text-amber-400'

  return (
    <div className="space-y-4">
      {esAdmin && (
        <>
          <div className="divide-y divide-bg-border/70 overflow-hidden rounded-[var(--radius-md)] border border-bg-border md:hidden">
            {movimientos.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <span className="text-sm text-text-secondary">{s.label}</span>
                <span className={`text-sm font-semibold tabular-nums ${s.color}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          <div className="hidden md:grid md:grid-cols-5 md:gap-3">
            {movimientos.map((s) => (
              <div
                key={s.label}
                className="rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/60 px-3 py-3"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  {s.label}
                </p>
                <p className={`mt-1.5 text-base font-semibold tabular-nums ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="space-y-2 rounded-[var(--radius-md)] bg-bg-elevated p-4 text-sm md:hidden">
        {esAdmin && (
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Efectivo esperado</span>
            <span className="font-medium tabular-nums text-text-primary">
              {formatPesos(esperado)}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-text-secondary">Dinero contado</span>
          <span className="font-medium tabular-nums text-text-primary">
            {formatPesos(cierre.dinero_final)}
          </span>
        </div>
        <div className="flex justify-between gap-3 border-t border-bg-border pt-2 font-medium">
          <span className="text-text-secondary">Diferencia</span>
          <span className={`tabular-nums ${colorDiferencia}`}>{textoDiferencia}</span>
        </div>
        {cierre.usuario?.nombre && (
          <p className="border-t border-bg-border pt-2 text-xs text-text-muted">
            Registrado por {cierre.usuario.nombre} ·{' '}
            <span className="capitalize">{cierre.estado}</span>
          </p>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-3 md:gap-3">
        {esAdmin && (
          <div className="rounded-[var(--radius-md)] border border-bg-border px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Efectivo esperado
            </p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-text-primary">
              {formatPesos(esperado)}
            </p>
          </div>
        )}
        <div className="rounded-[var(--radius-md)] border border-bg-border px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Dinero contado
          </p>
          <p className="mt-1.5 text-lg font-semibold tabular-nums text-text-primary">
            {formatPesos(cierre.dinero_final)}
          </p>
        </div>
        <div
          className={[
            'rounded-[var(--radius-md)] border px-4 py-3',
            diferencia === 0
              ? 'border-emerald-400/30 bg-emerald-400/10'
              : diferencia < 0
                ? 'border-accent-red/30 bg-accent-red-dim'
                : 'border-amber-400/30 bg-amber-500/10',
          ].join(' ')}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Diferencia
          </p>
          <p className={`mt-1.5 text-lg font-semibold tabular-nums ${colorDiferencia}`}>
            {textoDiferencia}
          </p>
        </div>
      </div>

      {cierre.observaciones && (
        <p className="text-xs text-text-secondary">
          <span className="text-text-primary">Nota:</span> {cierre.observaciones}
        </p>
      )}
    </div>
  )
}

function TabProductos({
  items,
  cargando,
  cierre,
  esAdmin,
}: {
  items: ProductoVendidoHistorial[]
  cargando: boolean
  cierre: CierreDia
  esAdmin: boolean
}) {
  const ventasVariantes = cierre.ventas_variantes ?? []
  const ventasComida = cierre.ventas_comida ?? []
  const hayComida = ventasVariantes.length > 0 || ventasComida.length > 0

  const variantesPorProducto = ventasVariantes.reduce<
    Record<string, typeof ventasVariantes>
  >((acc, v) => {
    const nombreProd = v.variante?.producto?.nombre ?? 'Producto'
    if (!acc[nombreProd]) acc[nombreProd] = []
    acc[nombreProd].push(v)
    return acc
  }, {})

  if (cargando && items.length === 0 && !hayComida) {
    return <p className="text-sm text-text-muted">Cargando productos...</p>
  }

  if (items.length === 0 && !hayComida) {
    return <p className="text-sm text-text-muted">Sin productos vendidos.</p>
  }

  return (
    <div className="space-y-5">
      {items.length > 0 && (
        <div className="space-y-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
            Vasos
          </p>
          <ul className="divide-y divide-bg-border/60">
            {items.map((p) => (
              <li
                key={p.producto_id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="min-w-0 capitalize text-text-primary">
                  {p.nombre} {p.onzas}oz
                  <span className="ml-2 text-text-muted">×{p.cantidad}</span>
                </span>
                {esAdmin && (
                  <span className="shrink-0 font-medium tabular-nums text-accent-cyan">
                    {formatPesos(p.subtotal)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hayComida && (
        <div className="space-y-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
            Comida
          </p>

          {Object.entries(variantesPorProducto).map(([nombreProd, variantes]) => (
            <div key={nombreProd} className="space-y-0.5">
              <p className="text-xs font-medium text-text-secondary">
                {nombreProd}
              </p>
              {variantes.map((v) => {
                const precio = v.variante?.precio ?? 0
                const subtotal = v.cantidad * precio
                return (
                  <div
                    key={v.id}
                    className="flex justify-between gap-3 py-1 pl-3 text-xs"
                  >
                    <span className="min-w-0 text-text-muted">
                      {v.variante?.nombre ?? 'Variante'} ×{v.cantidad}
                    </span>
                    {esAdmin && (
                      <span className="shrink-0 tabular-nums text-accent-green">
                        {formatPesos(subtotal)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {ventasComida.map((v) => {
            const precio = v.producto?.precio ?? 0
            const subtotal = v.cantidad * precio
            return (
              <div
                key={v.id}
                className="flex justify-between gap-3 py-1.5 text-xs"
              >
                <span className="min-w-0 text-text-secondary">
                  {v.producto?.nombre ?? 'Producto'} ×{v.cantidad}
                </span>
                {esAdmin && (
                  <span className="shrink-0 tabular-nums text-accent-green">
                    {formatPesos(subtotal)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabVasos({ cierre }: { cierre: CierreDia }) {
  const rows = cierre.conteo_vasos ?? []
  if (rows.length === 0) {
    return <p className="text-sm text-text-muted">Sin conteo de vasos.</p>
  }

  return (
    <motion.div layout className="space-y-3">
      <div className="hidden grid-cols-5 gap-2 text-xs text-text-muted md:grid">
        <span className="col-span-2">Talla</span>
        <span className="text-center">Inicio</span>
        <span className="text-center">Nuevos</span>
        <span className="text-right">Resultado</span>
      </div>

      {rows.map((conteo: ConteoVaso) => {
        const totalNovedades =
          conteo.novedades?.reduce((s, n) => s + n.cantidad, 0) ??
          conteo.cantidad_novedades ??
          0
        const gastados =
          conteo.cantidad_gastada ??
          Math.max(
            0,
            conteo.cantidad_inicio +
              conteo.cantidad_nuevos -
              conteo.cantidad_final
          )
        const vendidos =
          conteo.cantidad_vendida ?? Math.max(0, gastados - totalNovedades)
        const titulo = conteo.talla?.descripcion
          ? conteo.talla.descripcion
          : conteo.talla
            ? formatTalla(conteo.talla)
            : '—'

        return (
          <motion.div key={conteo.id} layout className="space-y-2">
            <div className="rounded-[var(--radius-md)] border border-bg-border px-3 py-2.5 md:hidden">
              <p className="text-sm text-text-primary">
                {titulo}
                {conteo.talla && (
                  <span className="ml-1 text-xs text-text-muted">
                    {conteo.talla.onzas} oz
                  </span>
                )}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">
                    Inicio
                  </p>
                  <p className="text-sm tabular-nums text-text-secondary">
                    {conteo.cantidad_inicio}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">
                    Nuevos
                  </p>
                  <p className="text-sm tabular-nums text-text-secondary">
                    +{conteo.cantidad_nuevos}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">
                    Vendidos
                  </p>
                  <p className="text-sm font-medium tabular-nums text-accent-cyan">
                    {vendidos}
                  </p>
                </div>
              </div>
              {totalNovedades > 0 && (
                <p className="mt-1.5 text-right text-xs tabular-nums text-accent-amber">
                  {totalNovedades} novedades
                </p>
              )}
            </div>

            <div className="hidden grid-cols-5 gap-2 text-sm md:grid">
              <span className="col-span-2 text-text-primary">
                {titulo}
                {conteo.talla && (
                  <span className="ml-1 text-xs text-text-muted">
                    {conteo.talla.onzas}oz
                  </span>
                )}
              </span>
              <span className="text-center tabular-nums text-text-muted">
                {conteo.cantidad_inicio}
              </span>
              <span className="text-center tabular-nums text-text-muted">
                +{conteo.cantidad_nuevos}
              </span>
              <div className="text-right">
                <span className="tabular-nums text-accent-cyan">
                  {vendidos} vendidos
                </span>
                {totalNovedades > 0 && (
                  <span className="block text-xs tabular-nums text-accent-amber">
                    {totalNovedades} novedades
                  </span>
                )}
              </div>
            </div>

            {conteo.novedades && conteo.novedades.length > 0 && (
              <div className="ml-3 space-y-1 border-l-2 border-bg-border pl-3">
                {conteo.novedades.map((n, i) => (
                  <div
                    key={n.id ?? i}
                    className="flex justify-between gap-2 text-xs text-text-muted"
                  >
                    <span className="min-w-0">
                      {n.motivo?.emoji}{' '}
                      {n.motivo?.descripcion === 'Otro'
                        ? n.motivo_custom || 'Otro'
                        : n.motivo?.descripcion}
                    </span>
                    <span className="shrink-0 tabular-nums text-accent-amber">
                      −{n.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {conteo.observacion && (
              <p className="ml-3 text-xs italic text-text-muted">
                &ldquo;{conteo.observacion}&rdquo;
              </p>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function TabGastosTransferencias({ cierre }: { cierre: CierreDia }) {
  const gastos = cierre.gastos ?? []
  const transferencias = cierre.transferencias ?? []
  const domicilios = cierre.domicilios ?? []

  if (
    gastos.length === 0 &&
    transferencias.length === 0 &&
    domicilios.length === 0
  ) {
    return (
      <p className="text-sm text-text-muted">
        Sin gastos, transferencias ni domicilios.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-bg-border/60">
      {gastos.map((g) => (
        <li
          key={g.id}
          className="flex justify-between gap-3 py-2.5 text-sm"
        >
          <span className="text-text-primary">Gasto — {g.descripcion}</span>
          <span className="shrink-0 tabular-nums text-text-secondary">
            {formatPesos(g.monto)}
          </span>
        </li>
      ))}
      {transferencias.map((t) => (
        <li
          key={t.id}
          className="flex justify-between gap-3 py-2.5 text-sm"
        >
          <span className="text-text-primary capitalize">
            Transfer. — {t.medio?.nombre ?? t.descripcion}
          </span>
          <span className="shrink-0 tabular-nums text-text-secondary">
            {formatPesos(t.monto)}
          </span>
        </li>
      ))}
      {domicilios.map((d) => (
        <li
          key={d.id}
          className="flex justify-between gap-3 py-2.5 text-sm"
        >
          <span className="text-text-primary">
            Domicilio{d.descripcion ? ` — ${d.descripcion}` : ''}
          </span>
          <span className="shrink-0 tabular-nums text-text-secondary">
            {formatPesos(d.monto)}
          </span>
        </li>
      ))}
    </ul>
  )
}

interface CierreCardProps {
  cierre: CierreDia
  esAdmin?: boolean
}

export function CierreCard({ cierre, esAdmin = true }: CierreCardProps) {
  const [abierto, setAbierto] = useState(false)
  const [tab, setTab] = useState<TabHistorial>('resumen')
  const [productos, setProductos] = useState<ProductoVendidoHistorial[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [productosCargados, setProductosCargados] = useState(false)

  const diferencia = getDiferenciaCierre(cierre)
  const estadoCuadre = getEstadoCuadre(diferencia)
  const vasosGastados = totalVasosGastadosCierre(cierre.conteo_vasos)

  const cargarProductos = useCallback(async () => {
    if (productosCargados) return
    setCargandoProductos(true)
    try {
      const res = await fetch(
        `/api/ventas?desde=${cierre.fecha}&hasta=${cierre.fecha}`
      )
      if (!res.ok) throw new Error()
      const ventas: Venta[] = await res.json()
      setProductos(mergeProductosVendidos(ventas))
      setProductosCargados(true)
    } catch {
      toast.error('Error cargando productos del día')
    } finally {
      setCargandoProductos(false)
    }
  }, [cierre.fecha, productosCargados])

  function toggleAbierto() {
    const next = !abierto
    setAbierto(next)
    if (next && !productosCargados) void cargarProductos()
  }

  const badgeCuadre =
    estadoCuadre === 'perfecto'
      ? 'bg-accent-green-dim text-[var(--accent-green)]'
      : estadoCuadre === 'falta'
        ? 'bg-accent-red-dim text-accent-red'
        : 'bg-amber-500/15 text-amber-400'

  const badgeTexto =
    estadoCuadre === 'perfecto'
      ? 'Cuadre perfecto'
      : estadoCuadre === 'falta'
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : `Sobran ${formatPesos(diferencia)}`

  const IconoCuadre =
    estadoCuadre === 'perfecto'
      ? CheckCircle2
      : estadoCuadre === 'falta'
        ? XCircle
        : AlertCircle

  const iconoColor =
    estadoCuadre === 'perfecto'
      ? 'text-[var(--accent-green)]'
      : estadoCuadre === 'falta'
        ? 'text-accent-red'
        : 'text-amber-400'

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={toggleAbierto}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-bg-elevated/40"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-elevated ${iconoColor}`}
          >
            <IconoCuadre size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold tracking-tight text-text-primary">
              {formatFecha(cierre.fecha)}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {cierre.usuario?.nombre ?? 'Sin responsable'}
              {cierre.estado === 'cerrado' ? ' · Cerrado' : ' · Abierto'}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
              {esAdmin && (
                <span className="text-sm font-semibold tabular-nums text-accent-cyan">
                  {formatPesos(cierre.total_ventas)}
                </span>
              )}
              <span className="text-xs text-text-muted tabular-nums">
                {vasosGastados} vasos
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeCuadre}`}
              >
                {badgeTexto}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            {esAdmin && (
              <p className="text-sm font-semibold tabular-nums text-accent-cyan">
                {formatPesos(cierre.total_ventas)}
              </p>
            )}
            <p className="text-xs text-text-muted tabular-nums">
              {vasosGastados} vasos
            </p>
          </div>
          <span
            className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${badgeCuadre}`}
          >
            {badgeTexto}
          </span>
          <motion.span
            animate={{ rotate: abierto ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-text-muted"
          >
            <ChevronDown size={18} aria-hidden />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-bg-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 md:mx-0 md:overflow-visible md:rounded-[var(--radius-md)] md:bg-bg-elevated md:p-1">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={[
                        'shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors md:flex-1 md:rounded-[var(--radius-sm)] md:px-3 md:py-2',
                        tab === t.id
                          ? 'bg-bg-surface font-medium text-text-primary shadow-sm ring-1 ring-bg-border md:ring-0'
                          : 'bg-bg-elevated text-text-muted hover:text-text-secondary md:bg-transparent',
                      ].join(' ')}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {esAdmin && cierre.estado === 'cerrado' && (
                  <Link
                    href={`/dashboard/cierre?fecha=${cierre.fecha}`}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-bg-border px-3 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent-cyan/40 hover:text-text-primary md:w-auto md:py-2"
                  >
                    <Pencil size={13} aria-hidden />
                    Corregir este día
                  </Link>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {tab === 'resumen' && (
                    <TabResumen cierre={cierre} esAdmin={esAdmin} />
                  )}
                  {tab === 'productos' && (
                    <TabProductos
                      items={productos}
                      cargando={cargandoProductos}
                      cierre={cierre}
                      esAdmin={esAdmin}
                    />
                  )}
                  {tab === 'vasos' && <TabVasos cierre={cierre} />}
                  {tab === 'gastos' && (
                    <TabGastosTransferencias cierre={cierre} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
