'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton, SkeletonStat } from '@/components/ui/Skeleton'
import { GraficoVentas } from '@/components/reportes/GraficoVentas'
import { fadeUp, staggerContainer } from '@/lib/animations'
import toast from 'react-hot-toast'
import {
  formatPesos,
  getRangoFecha,
  getSemanaHastaHoy,
  getUltimos7Dias,
} from '@/lib/utils'
import { fechaComoDate, hoyColombia } from '@/lib/fechas'
import type { ResumenDia, Rol, Venta } from '@/types'

interface DashboardResumenProps {
  rol: Rol
}

function totalVasos(venta: Venta) {
  return (
    venta.detalle?.reduce(
      (acc, d) => acc + ((d.origen ?? 'vaso') === 'vaso' ? d.cantidad : 0),
      0
    ) ?? 0
  )
}

function fillUltimos7Dias(resumen: ResumenDia[]): ResumenDia[] {
  const hoy = fechaComoDate(hoyColombia())
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = format(subDays(hoy, 6 - i), 'yyyy-MM-dd')
    return (
      resumen.find((r) => r.fecha === fecha) ?? {
        fecha,
        ingresos: 0,
        total_ventas: 0,
        total_vasos: 0,
      }
    )
  })
}

function formatDiaCorto(fecha: string) {
  return format(parseISO(fecha), 'EEE d', { locale: es })
}

export function DashboardResumen({ rol }: DashboardResumenProps) {
  const [loading, setLoading] = useState(true)
  const [ventasHoy, setVentasHoy] = useState<Venta[]>([])
  const [resumenSemana, setResumenSemana] = useState<ResumenDia[]>([])
  const [chartData, setChartData] = useState<ResumenDia[]>([])

  useEffect(() => {
    const { desde: hoyDesde, hasta: hoyHasta } = getRangoFecha('hoy')
    const { desde: semanaDesde, hasta: semanaHasta } = getSemanaHastaHoy()
    const { desde: chartDesde, hasta: chartHasta } = getUltimos7Dias()

    Promise.all([
      fetch(`/api/ventas?desde=${hoyDesde}&hasta=${hoyHasta}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/reportes?desde=${semanaDesde}&hasta=${semanaHasta}`).then(
        (r) => (r.ok ? r.json() : Promise.reject())
      ),
      fetch(`/api/reportes?desde=${chartDesde}&hasta=${chartHasta}`).then(
        (r) => (r.ok ? r.json() : Promise.reject())
      ),
    ])
      .then(([ventas, semana, chartRaw]: [Venta[], ResumenDia[], ResumenDia[]]) => {
        setVentasHoy(ventas)
        setResumenSemana(semana)
        setChartData(fillUltimos7Dias(chartRaw))
      })
      .catch(() => toast.error('Error cargando el resumen'))
      .finally(() => setLoading(false))
  }, [])

  const ingresosHoy = ventasHoy.reduce((s, v) => s + Number(v.total), 0)
  const vasosHoy = ventasHoy.reduce((s, v) => s + totalVasos(v), 0)
  const totalSemanal = resumenSemana.reduce((s, r) => s + r.ingresos, 0)
  const mejorDia = resumenSemana.reduce<ResumenDia | null>(
    (best, r) => (!best || r.ingresos > best.ingresos ? r : best),
    null
  )

  const ultimasVentas = [...ventasHoy]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const stats = [
    {
      title: '💰 Ingresos de hoy',
      value: formatPesos(ingresosHoy),
      glow: true,
      className: 'text-accent-cyan',
    },
    {
      title: '🧊 Vasos vendidos hoy',
      value: String(vasosHoy),
      className: 'text-accent-green',
    },
    {
      title: '📈 Mejor día de la semana',
      value: mejorDia
        ? formatPesos(mejorDia.ingresos)
        : formatPesos(0),
      description: mejorDia ? formatDiaCorto(mejorDia.fecha) : 'Sin ventas',
      className: 'text-text-primary',
    },
    {
      title: '📊 Total semanal',
      value: formatPesos(totalSemanal),
      className: 'text-accent-cyan',
    },
  ]

  return (
    <motion.div
      className="relative flex flex-col gap-5 p-4 pb-24 sm:gap-6 sm:p-6 md:pb-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {loading ? (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          variants={staggerContainer}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={fadeUp} className="h-full">
              <SkeletonStat />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          variants={staggerContainer}
        >
          {stats.map((stat) => (
            <motion.div key={stat.title} variants={fadeUp} className="h-full">
              <Card title={stat.title} glow={stat.glow} fillHeight>
                <p
                  className={`font-display text-xl font-bold tabular-nums sm:text-2xl ${stat.className}`}
                >
                  {stat.value}
                </p>
                <p
                  className={[
                    'mt-1 min-h-5 text-xs capitalize text-text-secondary sm:text-sm',
                    !stat.description && 'invisible',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden={!stat.description}
                >
                  {stat.description ?? '—'}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <Card title="Ingresos — últimos 7 días">
          {loading ? (
            <Skeleton className="h-[220px] w-full sm:h-[320px]" />
          ) : (
            <div className="h-[220px] w-full min-w-0 sm:h-[320px]">
              <GraficoVentas data={chartData} />
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card title="Últimas ventas">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-md)] md:h-14" />
              ))}
            </div>
          ) : ultimasVentas.length === 0 ? (
            <p className="text-sm text-text-muted">
              No hay ventas registradas hoy.
            </p>
          ) : (
            <>
              {/* Mobile: cards */}
              <ul className="flex flex-col gap-3 md:hidden">
                {ultimasVentas.map((venta) => (
                  <li
                    key={venta.id}
                    className="rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/30 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">
                          {venta.usuario?.nombre ?? 'Vendedor'}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {format(parseISO(venta.created_at), 'HH:mm', {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-semibold text-accent-cyan tabular-nums">
                        {formatPesos(venta.total)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-bg-border pt-2.5">
                      <span className="text-xs text-text-secondary">Vasos</span>
                      <span className="text-sm font-semibold text-text-primary tabular-nums">
                        {totalVasos(venta)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: lista compacta */}
              <ul className="hidden divide-y divide-bg-border md:block">
                {ultimasVentas.map((venta) => (
                  <li
                    key={venta.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary">
                        {venta.usuario?.nombre ?? 'Vendedor'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {format(parseISO(venta.created_at), 'HH:mm', {
                          locale: es,
                        })}{' '}
                        · {totalVasos(venta)} vasos
                      </p>
                    </div>
                    <p className="shrink-0 font-medium text-accent-cyan tabular-nums">
                      {formatPesos(venta.total)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </motion.div>

      {rol === 'empleado' && (
        <Link
          href="/dashboard/ventas"
          className="focus-ring-cyan fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-accent-cyan px-5 py-3 text-sm font-medium text-bg-base shadow-glow-cyan transition-surface hover:brightness-110 md:hidden"
        >
          <ShoppingCart size={20} aria-hidden />
          Registrar Venta
        </Link>
      )}
    </motion.div>
  )
}
