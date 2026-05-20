'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { GraficoIngresosLinea } from '@/components/reportes/GraficoIngresosLinea'
import { GraficoVasosBarras } from '@/components/reportes/GraficoVasosBarras'
import { Skeleton, SkeletonStat, SkeletonTabla } from '@/components/ui/Skeleton'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { formatPesos, getRangoFecha } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ResumenDia, Venta } from '@/types'

type PeriodoPreset = 'hoy' | 'semana' | 'quincena' | 'mes' | 'custom'

const PERIODOS: { id: PeriodoPreset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'quincena', label: 'Quincena' },
  { id: 'mes', label: 'Mes' },
]

type ProductoVendido = {
  producto_id: string
  nombre: string
  onzas: number
  cantidad: number
  ingresos: number
}

function fillRango(resumen: ResumenDia[], desde: string, hasta: string) {
  const map = new Map(resumen.map((r) => [r.fecha, r]))
  const out: ResumenDia[] = []
  let cur = parseISO(desde)
  const end = parseISO(hasta)
  while (cur <= end) {
    const fecha = format(cur, 'yyyy-MM-dd')
    out.push(
      map.get(fecha) ?? {
        fecha,
        ingresos: 0,
        total_vasos: 0,
        total_ventas: 0,
      }
    )
    cur = addDays(cur, 1)
  }
  return out
}

function agruparProductos(ventas: Venta[]): ProductoVendido[] {
  const map = new Map<string, ProductoVendido>()
  for (const venta of ventas) {
    for (const d of venta.detalle ?? []) {
      const prev = map.get(d.producto_id) ?? {
        producto_id: d.producto_id,
        nombre: d.producto?.nombre ?? 'Producto',
        onzas: d.producto?.onzas ?? 0,
        cantidad: 0,
        ingresos: 0,
      }
      map.set(d.producto_id, {
        ...prev,
        cantidad: prev.cantidad + d.cantidad,
        ingresos: prev.ingresos + Number(d.subtotal ?? d.cantidad * d.precio_unitario),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad)
}

function ProductosVendidosLista({
  productos,
}: {
  productos: ProductoVendido[]
}) {
  return (
    <>
      {/* Vista móvil: tarjetas */}
      <ul className="flex flex-col gap-3 md:hidden">
        {productos.map((p, i) => (
          <li
            key={p.producto_id}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-text-muted">
                    #{i + 1}
                  </span>
                  <p className="mt-0.5 font-medium leading-snug text-text-primary">
                    {p.nombre}
                  </p>
                  <span className="badge-cyan mt-1.5 inline-block tabular-nums">
                    {p.onzas} oz
                  </span>
                </div>
                <p className="shrink-0 text-base font-semibold text-accent-cyan tabular-nums">
                  {formatPesos(p.ingresos)}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-bg-border pt-3">
                <span className="text-sm text-text-muted">Cantidad vendida</span>
                <span className="badge-cyan tabular-nums">{p.cantidad}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Vista escritorio: tabla */}
      <div className="table-surface hidden overflow-x-auto md:block">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Onzas</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3 text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.producto_id} className="border-t border-bg-border">
                <td className="px-4 py-3">
                  <span className="mr-2 text-text-muted">#{i + 1}</span>
                  <span className="font-medium text-text-primary">
                    {p.nombre}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">
                  {p.onzas} oz
                </td>
                <td className="px-4 py-3">
                  <span className="badge-cyan tabular-nums">{p.cantidad}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-accent-cyan tabular-nums">
                  {formatPesos(p.ingresos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function ReportesDashboard() {
  const [preset, setPreset] = useState<PeriodoPreset>('semana')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [resumen, setResumen] = useState<ResumenDia[]>([])
  const [topProductos, setTopProductos] = useState<ProductoVendido[]>([])
  const [nombreNegocio, setNombreNegocio] = useState('Cholao Oscar')
  const [loading, setLoading] = useState(true)

  const rango = useMemo(() => {
    if (preset === 'custom') {
      if (customDesde && customHasta) {
        return { desde: customDesde, hasta: customHasta }
      }
      return getRangoFecha('semana')
    }
    return getRangoFecha(preset)
  }, [preset, customDesde, customHasta])

  const cargar = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/reportes?desde=${rango.desde}&hasta=${rango.hasta}`).then(
        (r) => (r.ok ? r.json() : Promise.reject())
      ),
      fetch(`/api/ventas?desde=${rango.desde}&hasta=${rango.hasta}`).then(
        (r) => (r.ok ? r.json() : Promise.reject())
      ),
    ])
      .then(([raw, ventas]: [ResumenDia[], Venta[]]) => {
        setResumen(fillRango(raw, rango.desde, rango.hasta))
        setTopProductos(agruparProductos(ventas))
      })
      .catch(() => toast.error('Error cargando reportes'))
      .finally(() => setLoading(false))
  }, [rango.desde, rango.hasta])

  useEffect(() => {
    if (preset === 'custom' && (!customDesde || !customHasta)) return
    cargar()
  }, [cargar, preset, customDesde, customHasta])

  useEffect(() => {
    fetch('/api/configuracion')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.nombre_negocio) setNombreNegocio(data.nombre_negocio)
      })
      .catch(() => {})
  }, [])

  const totalIngresos = resumen.reduce((s, r) => s + r.ingresos, 0)
  const totalVasos = resumen.reduce((s, r) => s + r.total_vasos, 0)
  const diasPeriodo =
    differenceInCalendarDays(parseISO(rango.hasta), parseISO(rango.desde)) + 1
  const promedioDiario = diasPeriodo > 0 ? totalIngresos / diasPeriodo : 0

  function seleccionarPreset(id: PeriodoPreset) {
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

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-5 sm:gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <p className="text-sm text-text-secondary">{nombreNegocio}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1 pb-0.5">
          <div className="flex w-max min-w-full flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => seleccionarPreset(p.id)}
                className={
                  preset === p.id
                    ? 'filter-pill filter-pill-active shrink-0'
                    : 'filter-pill filter-pill-inactive shrink-0'
                }
              >
                {p.label}
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
        <Button
          type="button"
          variant="secondary"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => toast('Exportar estará disponible pronto', { icon: '📄' })}
        >
          <Download size={18} className="mr-2" aria-hidden />
          Exportar
        </Button>
      </div>

      {preset === 'custom' && (
        <motion.div
          variants={fadeUp}
          className="grid gap-3 rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface p-4 sm:grid-cols-2 sm:items-end"
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="rep-desde" className="text-sm text-text-secondary">
              Desde
            </label>
            <input
              id="rep-desde"
              type="date"
              value={customDesde}
              onChange={(e) => setCustomDesde(e.target.value)}
              className="select-field w-full min-w-0"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="rep-hasta" className="text-sm text-text-secondary">
              Hasta
            </label>
            <input
              id="rep-hasta"
              type="date"
              value={customHasta}
              min={customDesde}
              onChange={(e) => setCustomHasta(e.target.value)}
              className="select-field w-full min-w-0"
            />
          </div>
        </motion.div>
      )}

      {loading ? (
        <motion.div className="grid gap-4 sm:grid-cols-3" variants={staggerContainer}>
          <motion.div variants={fadeUp} className="h-full">
            <SkeletonStat />
          </motion.div>
          <motion.div variants={fadeUp} className="h-full">
            <SkeletonStat />
          </motion.div>
          <motion.div variants={fadeUp} className="h-full">
            <SkeletonStat />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-3"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="h-full">
            <Card title="Ingresos totales" glow fillHeight>
              <p className="font-display text-xl font-bold text-accent-cyan tabular-nums sm:text-2xl">
                {formatPesos(totalIngresos)}
              </p>
              <p className="mt-1 min-h-5 text-xs text-text-muted invisible" aria-hidden>
                —
              </p>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} className="h-full">
            <Card title="Total vasos" fillHeight>
              <p className="font-display text-xl font-bold text-accent-green tabular-nums sm:text-2xl">
                {totalVasos}
              </p>
              <p className="mt-1 min-h-5 text-xs text-text-muted invisible" aria-hidden>
                —
              </p>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} className="h-full">
            <Card title="Promedio diario" fillHeight>
              <p className="font-display text-xl font-bold text-text-primary tabular-nums sm:text-2xl">
                {formatPesos(promedioDiario)}
              </p>
              <p className="mt-1 min-h-5 text-xs text-text-muted">
                {diasPeriodo} día{diasPeriodo !== 1 ? 's' : ''} en el período
              </p>
            </Card>
          </motion.div>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card title="Ingresos por día">
          {loading ? (
            <Skeleton className="h-[260px] w-full sm:h-[300px]" />
          ) : (
            <div className="min-w-0 -mx-1 px-1 sm:mx-0 sm:px-0">
              <GraficoIngresosLinea data={resumen} />
            </div>
          )}
        </Card>
        <Card title="Vasos vendidos por día">
          {loading ? (
            <Skeleton className="h-[260px] w-full sm:h-[300px]" />
          ) : (
            <div className="min-w-0 -mx-1 px-1 sm:mx-0 sm:px-0">
              <GraficoVasosBarras data={resumen} />
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="min-w-0">
        <Card title="Productos más vendidos">
          {loading ? (
            <SkeletonTabla filas={5} />
          ) : topProductos.length === 0 ? (
            <p className="text-sm text-text-muted">
              Sin ventas en este período.
            </p>
          ) : (
            <ProductosVendidosLista productos={topProductos} />
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
