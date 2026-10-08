'use client'

import { useMemo, useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { GraficoIngresosLinea } from '@/components/reportes/GraficoIngresosLinea'
import { GraficoVasosBarras } from '@/components/reportes/GraficoVasosBarras'
import { Skeleton, SkeletonStat } from '@/components/ui/Skeleton'
import { fadeUp, staggerContainer } from '@/lib/animations'
import type { FormatoExport } from '@/lib/export-reportes'
import { exportarPeriodo } from '@/lib/exportar-periodo'
import { formatPesos } from '@/lib/utils'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { ResumenDia, Venta } from '@/types'
import { FiltroRango } from '@/components/ui/FiltroRango'
import { ProductosVendidosLista } from '@/components/reportes/ProductosVendidosLista'
import { useApiGet } from '@/hooks/useApiGet'
import { useRangoFechas } from '@/hooks/useRangoFechas'
import { agruparProductos, fillRango } from '@/lib/reportes'

export function ReportesDashboard() {
  const filtro = useRangoFechas('semana')
  const { rango, completo } = filtro
  const resumenApi = useApiGet<ResumenDia[]>(
    completo ? `/api/reportes?desde=${rango.desde}&hasta=${rango.hasta}` : null
  )
  const ventasApi = useApiGet<Venta[]>(
    completo ? `/api/ventas?desde=${rango.desde}&hasta=${rango.hasta}` : null
  )
  const configApi = useApiGet<{ nombre_negocio: string }>('/api/configuracion')
  const [exportando, setExportando] = useState<FormatoExport | null>(null)

  const loading = resumenApi.loading || ventasApi.loading
  const nombreNegocio = configApi.data?.nombre_negocio ?? 'Cholao Oscar'
  const resumen = useMemo(
    () => fillRango(resumenApi.data ?? [], rango.desde, rango.hasta),
    [resumenApi.data, rango.desde, rango.hasta]
  )
  const topProductos = useMemo(() => agruparProductos(ventasApi.data ?? []), [ventasApi.data])

  const totalIngresos = resumen.reduce((s, r) => s + r.ingresos, 0)
  const totalVasos = resumen.reduce((s, r) => s + r.total_vasos, 0)
  const diasPeriodo = differenceInCalendarDays(parseISO(rango.hasta), parseISO(rango.desde)) + 1
  const promedioDiario = diasPeriodo > 0 ? totalIngresos / diasPeriodo : 0

  async function exportar(formato: FormatoExport) {
    if (loading || exportando) return
    setExportando(formato)
    const toastId = toastLoading(formato === 'excel' ? 'Generando Excel...' : 'Generando PDF...')
    try {
      const nombre = await exportarPeriodo(formato, {
        desde: rango.desde,
        hasta: rango.hasta,
        nombreNegocio,
      })
      toastSuccess(`Descargado: ${nombre}`, toastId)
    } catch (e) {
      toastError((e as Error).message || 'No se pudo generar el archivo', toastId)
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
      <p className="text-text-secondary text-sm">{nombreNegocio}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <FiltroRango filtro={filtro} idPrefix="reportes" />
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

      {loading && !resumenApi.data ? (
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
              <p className="font-display text-accent-cyan text-xl font-bold tabular-nums sm:text-2xl">
                {formatPesos(totalIngresos)}
              </p>
              <p className="text-text-muted invisible mt-1 min-h-5 text-xs" aria-hidden>
                —
              </p>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} className="h-full">
            <Card title="Total vasos" fillHeight>
              <p className="font-display text-accent-green text-xl font-bold tabular-nums sm:text-2xl">
                {totalVasos}
              </p>
              <p className="text-text-muted invisible mt-1 min-h-5 text-xs" aria-hidden>
                —
              </p>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} className="h-full">
            <Card title="Promedio diario" fillHeight>
              <p className="font-display text-text-primary text-xl font-bold tabular-nums sm:text-2xl">
                {formatPesos(promedioDiario)}
              </p>
              <p className="text-text-muted mt-1 min-h-5 text-xs">
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
                <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-md)] md:h-14" />
              ))}
            </div>
          ) : topProductos.length === 0 ? (
            <p className="text-text-muted text-sm">Sin ventas en este período.</p>
          ) : (
            <ProductosVendidosLista productos={topProductos} />
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
