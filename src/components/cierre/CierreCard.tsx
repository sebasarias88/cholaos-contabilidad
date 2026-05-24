'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
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
  { id: 'gastos', label: 'Gastos y Trans.' },
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
      cierre.total_gastos

  return (
    <div className="space-y-4">
      {esAdmin && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              label: 'Base inicio',
              value: formatPesos(cierre.dinero_base_inicio),
              color: 'text-text-secondary',
            },
            {
              label: 'Ventas',
              value: formatPesos(cierre.total_ventas),
              color: 'text-accent-cyan',
            },
            {
              label: '− Gastos',
              value: formatPesos(cierre.total_gastos),
              color: 'text-accent-red',
            },
            {
              label: '− Transfer.',
              value: formatPesos(cierre.total_transferencias),
              color: 'text-amber-400',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[var(--radius-md)] bg-bg-elevated p-3"
            >
              <p className="text-xs text-text-muted">{s.label}</p>
              <p
                className={`mt-1 text-sm font-medium tabular-nums ${s.color}`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[var(--radius-md)] bg-bg-elevated p-4 space-y-2 text-sm">
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
          <span
            className={[
              'tabular-nums',
              diferencia === 0
                ? 'text-emerald-400'
                : diferencia < 0
                  ? 'text-accent-red'
                  : 'text-amber-400',
            ].join(' ')}
          >
            {diferencia === 0
              ? 'Cuadre exacto'
              : diferencia < 0
                ? `Falta ${formatPesos(Math.abs(diferencia))}`
                : `Sobran ${formatPesos(diferencia)}`}
          </span>
        </div>
        {cierre.usuario?.nombre && (
          <p className="border-t border-bg-border pt-2 text-xs text-text-muted">
            Registrado por {cierre.usuario.nombre} ·{' '}
            <span className="capitalize">{cierre.estado}</span>
          </p>
        )}
        {cierre.observaciones && (
          <p className="text-xs text-text-secondary">
            <span className="text-text-primary">Nota:</span>{' '}
            {cierre.observaciones}
          </p>
        )}
      </div>
    </div>
  )
}

function TabProductos({
  items,
  cargando,
}: {
  items: ProductoVendidoHistorial[]
  cargando: boolean
}) {
  if (cargando) {
    return <p className="text-sm text-text-muted">Cargando productos...</p>
  }
  if (items.length === 0) {
    return <p className="text-sm text-text-muted">Sin productos vendidos.</p>
  }

  return (
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
          <span className="shrink-0 font-medium tabular-nums text-accent-cyan">
            {formatPesos(p.subtotal)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function TabVasos({ cierre }: { cierre: CierreDia }) {
  const rows = cierre.conteo_vasos ?? []
  if (rows.length === 0) {
    return <p className="text-sm text-text-muted">Sin conteo de vasos.</p>
  }

  return (
    <motion.div layout className="space-y-3">
      <div className="hidden grid-cols-5 gap-2 text-xs text-text-muted sm:grid">
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
            <div className="grid grid-cols-5 gap-2 text-sm">
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

  if (gastos.length === 0 && transferencias.length === 0) {
    return <p className="text-sm text-text-muted">Sin gastos ni transferencias.</p>
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
          <span className="text-text-primary">Transfer. — {t.descripcion}</span>
          <span className="shrink-0 tabular-nums text-text-secondary">
            {formatPesos(t.monto)}
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
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-bg-elevated/50"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <IconoCuadre
            size={18}
            className={`mt-0.5 shrink-0 ${iconoColor}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {formatFecha(cierre.fecha)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              {esAdmin && (
                <span className="font-medium text-accent-cyan tabular-nums">
                  {formatPesos(cierre.total_ventas)} vendido
                </span>
              )}
              <span className="tabular-nums">{vasosGastados} vasos</span>
              <span className="tabular-nums">
                {formatPesos(cierre.total_gastos)} gastos
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCuadre}`}
          >
            {badgeTexto}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            {abierto ? 'Ver menos' : 'Ver más'}
            <motion.span
              animate={{ rotate: abierto ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} aria-hidden />
            </motion.span>
          </span>
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
              <div className="flex gap-1 rounded-[var(--radius-md)] bg-bg-elevated p-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={[
                      'flex-1 rounded-[var(--radius-sm)] py-1.5 text-xs transition-colors',
                      tab === t.id
                        ? 'bg-bg-surface font-medium text-text-primary'
                        : 'text-text-muted hover:text-text-secondary',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
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
