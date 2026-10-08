'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { CalendarDays, CupSoda, Database, Trophy, Wallet, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarrasSemana } from '@/components/dashboard/BarrasSemana'
import { EstadoCierreHoy } from '@/components/dashboard/EstadoCierreHoy'
import { TarjetaKpi } from '@/components/dashboard/TarjetaKpi'
import { BarraProgreso } from '@/components/ui/BarraProgreso'
import { Card } from '@/components/ui/Card'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp, staggerContainer } from '@/lib/animations'
import {
  formatBytes,
  nivelUso,
  porcentajeUso,
  LIMITE_BD_BYTES,
  type UsoAlmacenamiento,
} from '@/lib/almacenamiento'
import { fechaComoDate, hoyColombia } from '@/lib/fechas'
import {
  capitalizar,
  formatPesos,
  getRangoFecha,
  getSemanaHastaHoy,
  getUltimos7Dias,
} from '@/lib/utils'
import type { CierreDia, ResumenDia, Venta } from '@/types'

function totalVasos(venta: Venta) {
  return (
    venta.detalle?.reduce(
      (acc, d) => acc + ((d.origen ?? 'vaso') === 'vaso' ? d.cantidad : 0),
      0
    ) ?? 0
  )
}

function llenarUltimos7Dias(resumen: ResumenDia[]): ResumenDia[] {
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

function saludo() {
  const hora = Number(
    new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Bogota',
    }).format(new Date())
  )
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(url)
  return r.json()
}

export function DashboardResumen({ nombre }: { nombre: string }) {
  const hoy = hoyColombia()
  const [loading, setLoading] = useState(true)
  const [ventasHoy, setVentasHoy] = useState<Venta[]>([])
  const [semana, setSemana] = useState<ResumenDia[]>([])
  const [ultimos7, setUltimos7] = useState<ResumenDia[]>([])
  const [cierreHoy, setCierreHoy] = useState<CierreDia | null>(null)
  const [uso, setUso] = useState<UsoAlmacenamiento | null>(null)

  useEffect(() => {
    const rHoy = getRangoFecha('hoy')
    const rSemana = getSemanaHastaHoy()
    const r7 = getUltimos7Dias()

    Promise.all([
      getJson<Venta[]>(`/api/ventas?desde=${rHoy.desde}&hasta=${rHoy.hasta}`),
      getJson<ResumenDia[]>(`/api/reportes?desde=${rSemana.desde}&hasta=${rSemana.hasta}`),
      getJson<ResumenDia[]>(`/api/reportes?desde=${r7.desde}&hasta=${r7.hasta}`),
      getJson<CierreDia | null>(`/api/cierres?fecha=${hoyColombia()}`).catch(() => null),
    ])
      .then(([ventas, sem, siete, cierre]) => {
        setVentasHoy(ventas)
        setSemana(sem)
        setUltimos7(llenarUltimos7Dias(siete))
        setCierreHoy(cierre)
      })
      .catch(() => toast.error('No se pudo cargar el resumen'))
      .finally(() => setLoading(false))

    // El almacenamiento no bloquea la pantalla
    getJson<UsoAlmacenamiento>('/api/almacenamiento')
      .then(setUso)
      .catch(() => setUso(null))
  }, [])

  const ingresosHoy = ventasHoy.reduce((s, v) => s + Number(v.total), 0)
  const vasosHoy = ventasHoy.reduce((s, v) => s + totalVasos(v), 0)
  const totalSemana = semana.reduce((s, r) => s + r.ingresos, 0)
  const mejorDia = semana.reduce<ResumenDia | null>(
    (best, r) => (!best || r.ingresos > best.ingresos ? r : best),
    null
  )
  const ultimasVentas = [...ventasHoy]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  const primerNombre = nombre.split(' ')[0]
  const fechaLarga = format(fechaComoDate(hoy), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo={`${saludo()}, ${primerNombre}`}
        descripcion={capitalizar(fechaLarga)}
      />

      {loading ? (
        <Skeleton className="h-[120px] rounded-[24px]" />
      ) : (
        <EstadoCierreHoy cierre={cierreHoy} />
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[122px] rounded-[20px]" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <TarjetaKpi titulo="Ventas de hoy" valor={ingresosHoy} icono={Wallet} tono="brand" />
          <TarjetaKpi
            titulo="Vasos de hoy"
            valor={vasosHoy}
            formato="numero"
            icono={CupSoda}
            tono="ok"
            detalle={`${ventasHoy.length} ventas registradas`}
          />
          <TarjetaKpi
            titulo="Esta semana"
            valor={totalSemana}
            icono={CalendarDays}
            tono="cocoa"
            detalle="Desde el lunes"
          />
          <TarjetaKpi
            titulo="Mejor día"
            valor={mejorDia?.ingresos ?? 0}
            icono={Trophy}
            tono="warn"
            detalle={
              mejorDia
                ? capitalizar(format(parseISO(mejorDia.fecha), 'EEEE d', { locale: es }))
                : 'Sin ventas aún'
            }
          />
        </motion.div>
      )}

      <motion.div
        className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="min-w-0">
          <Card
            title="Últimos 7 días"
            description="Ingresos por día"
            fillHeight
            action={
              <Link
                href="/dashboard/reportes"
                className="focus-ring text-brand hover:text-brand-strong inline-flex items-center gap-1 text-sm font-bold"
              >
                Reportes <ArrowRight size={15} aria-hidden />
              </Link>
            }
          >
            {loading ? (
              <Skeleton className="h-[220px] w-full flex-1" />
            ) : (
              <BarrasSemana dias={ultimos7} hoy={hoy} />
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <Card title="Últimas ventas de hoy" fillHeight>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : ultimasVentas.length === 0 ? (
              <EstadoVacio
                titulo="Sin ventas todavía"
                descripcion="Las ventas de hoy aparecerán aquí."
              />
            ) : (
              <ul className="divide-bg-border -my-1 divide-y">
                {ultimasVentas.map((venta, i) => (
                  <motion.li
                    key={venta.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold">
                      {(venta.usuario?.nombre ?? 'V').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary truncate text-sm font-bold">
                        {venta.usuario?.nombre ?? 'Vendedor'}
                      </p>
                      <p className="text-text-muted text-xs">
                        {format(parseISO(venta.created_at), 'h:mm a', { locale: es })} ·{' '}
                        {totalVasos(venta)} vasos
                      </p>
                    </div>
                    <span className="text-text-primary text-sm font-extrabold tabular-nums">
                      {formatPesos(venta.total)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>

          {uso && <MiniAlmacenamiento bytes={uso.bytes_total} />}
        </motion.div>
      </motion.div>
    </div>
  )
}

function MiniAlmacenamiento({ bytes }: { bytes: number }) {
  const pct = porcentajeUso(bytes)
  const nivel = nivelUso(bytes)
  const color = nivel === 'critico' ? 'bad' : nivel === 'aviso' ? 'warn' : 'ok'
  return (
    <Link
      href="/dashboard/almacenamiento"
      className="card-hover focus-ring flex items-center gap-4 p-4"
    >
      <span className="bg-bg-elevated text-text-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]">
        <Database size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          <span className="text-text-primary font-bold">Almacenamiento</span>
          <span className="text-text-muted text-xs font-semibold">
            {formatBytes(bytes)} de {formatBytes(LIMITE_BD_BYTES)}
          </span>
        </div>
        <BarraProgreso valor={pct} color={color} label="Uso del almacenamiento" />
      </div>
    </Link>
  )
}
