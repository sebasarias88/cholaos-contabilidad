'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { GraficoIngresosLinea } from '@/components/reportes/GraficoIngresosLinea'
import { GraficoVasosBarras } from '@/components/reportes/GraficoVasosBarras'
import { Skeleton, SkeletonStat } from '@/components/ui/Skeleton'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { exportarReporte as generarArchivo, type FormatoExport } from '@/lib/export-reportes'
import { formatPesos, getRangoFecha } from '@/lib/utils'
import { hoyColombia } from '@/lib/fechas'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { CierreDia, ResumenDia, Venta } from '@/types'

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
  tipo: string
  medida: string
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

function etiquetaTipoProducto(origen: string | undefined, tipo: string | undefined) {
  if (origen === 'variante') return 'Variante'
  if (origen === 'comida' || tipo === 'comida') return 'Comida'
  if (tipo === 'insumo') return 'Insumo'
  return 'Vaso'
}

function medidaProducto(origen: string | undefined, onzas?: number, unidad?: string) {
  if ((origen ?? 'vaso') === 'vaso' && onzas) return `${onzas} oz`
  return unidad ?? ''
}

function agruparProductos(ventas: Venta[]): ProductoVendido[] {
  const map = new Map<string, ProductoVendido>()
  for (const venta of ventas) {
    for (const d of venta.detalle ?? []) {
      const tipo = etiquetaTipoProducto(d.origen, d.producto?.tipo)
      const key = `${d.origen ?? 'vaso'}:${d.producto_id}:${d.producto?.nombre ?? ''}`
      const prev = map.get(key) ?? {
        producto_id: key,
        nombre: d.producto?.nombre ?? 'Producto',
        tipo,
        medida: medidaProducto(d.origen, d.producto?.onzas, d.producto?.unidad),
        cantidad: 0,
        ingresos: 0,
      }
      map.set(key, {
        ...prev,
        cantidad: prev.cantidad + d.cantidad,
        ingresos: prev.ingresos + Number(d.subtotal ?? d.cantidad * d.precio_unitario),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.ingresos - a.ingresos)
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
            className="rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/30 p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                    #{i + 1}
                  </span>
                  {p.medida && (
                    <span className="badge-cyan tabular-nums">{p.medida}</span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-text-primary">
                  {p.nombre}
                </p>
                <p className="text-xs text-text-muted">
                  {p.tipo}
                  {p.medida ? ` · ${p.medida}` : ''}
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold text-accent-cyan tabular-nums">
                {formatPesos(p.ingresos)}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-bg-border pt-2.5">
              <span className="text-xs text-text-secondary">Cantidad</span>
              <span className="text-sm font-semibold text-text-primary tabular-nums">
                {p.cantidad}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Vista escritorio: tabla */}
      <div className="table-surface hidden min-w-0 max-w-full md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-name">Producto</th>
              <th className="col-compact min-w-[5.5rem]">Tipo</th>
              <th className="col-compact min-w-[5rem]">Cantidad</th>
              <th className="col-compact min-w-[6.5rem] text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.producto_id}>
                <td className="col-name">
                  <span className="mr-2 text-text-muted">#{i + 1}</span>
                  <span className="font-medium text-text-primary">
                    {p.nombre}
                  </span>
                </td>
                <td className="col-compact text-text-secondary">
                  {p.tipo}
                  {p.medida ? (
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {p.medida}
                    </span>
                  ) : null}
                </td>
                <td className="col-compact">
                  <span className="badge-cyan tabular-nums">{p.cantidad}</span>
                </td>
                <td className="col-compact text-right font-medium text-accent-cyan tabular-nums">
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
  const [rangoCargado, setRangoCargado] = useState<string | null>(null)
  const [exportando, setExportando] = useState<FormatoExport | null>(null)

  const rango = useMemo(() => {
    if (preset === 'custom') {
      if (customDesde && customHasta) {
        return { desde: customDesde, hasta: customHasta }
      }
      return getRangoFecha('semana')
    }
    return getRangoFecha(preset)
  }, [preset, customDesde, customHasta])
  const claveRango = `${rango.desde}|${rango.hasta}`
  const loading = rangoCargado !== claveRango

  const cargar = useCallback(() => {
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
      .catch(() => toastError('Error cargando reportes'))
      .finally(() => setRangoCargado(claveRango))
  }, [rango.desde, rango.hasta, claveRango])

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
      const hoy = hoyColombia()
      setCustomDesde((d) => d || hoy)
      setCustomHasta((h) => h || hoy)
    }
  }

  async function exportar(formato: FormatoExport) {
    if (loading || exportando) return
    if (
      resumen.every((d) => d.ingresos === 0 && d.total_vasos === 0) &&
      topProductos.length === 0
    ) {
      toastError('No hay datos para exportar en este período')
      return
    }
    setExportando(formato)
    const toastId = toastLoading(formato === 'excel' ? 'Generando Excel...' : 'Generando PDF...')
    try {
      const res = await fetch(`/api/cierres?desde=${rango.desde}&hasta=${rango.hasta}`)
      if (!res.ok) throw new Error()
      const cierres = (await res.json()) as CierreDia[]
      const nombre = await generarArchivo(formato, {
        nombreNegocio,
        desde: rango.desde,
        hasta: rango.hasta,
        resumen,
        cierres: Array.isArray(cierres) ? cierres : [],
        productos: topProductos.map((p) => ({
          nombre: p.nombre,
          tipo: p.tipo,
          medida: p.medida,
          cantidad: p.cantidad,
          ingresos: p.ingresos,
        })),
      })
      toastSuccess(`Descargado: ${nombre}`, toastId)
    } catch {
      toastError('No se pudo generar el archivo', toastId)
    } finally {
      setExportando(null)
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
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 sm:flex-none"
            disabled={loading || exportando !== null}
            loading={exportando === 'excel'}
            onClick={() => exportar('excel')}
          >
            <FileSpreadsheet size={18} className="mr-2" aria-hidden />
            Excel
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1 sm:flex-none"
            disabled={loading || exportando !== null}
            loading={exportando === 'pdf'}
            onClick={() => exportar('pdf')}
          >
            <FileText size={18} className="mr-2" aria-hidden />
            PDF
          </Button>
        </div>
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
        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
          variants={staggerContainer}
        >
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
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
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

      <motion.div variants={fadeUp} className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card title="Ingresos por día">
          {loading ? (
            <Skeleton className="h-[200px] w-full sm:h-[300px]" />
          ) : (
            <div className="h-[200px] w-full min-w-0 sm:h-[300px]">
              <GraficoIngresosLinea data={resumen} />
            </div>
          )}
        </Card>
        <Card title="Vasos vendidos por día">
          {loading ? (
            <Skeleton className="h-[200px] w-full sm:h-[300px]" />
          ) : (
            <div className="h-[200px] w-full min-w-0 sm:h-[300px]">
              <GraficoVasosBarras data={resumen} />
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="min-w-0">
        <Card title="Productos más vendidos">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-24 w-full rounded-[var(--radius-md)] md:h-14"
                />
              ))}
            </div>
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
