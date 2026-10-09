'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ChevronDown, Pencil, XCircle } from 'lucide-react'
import {
  getDiferenciaCierre,
  getEstadoCuadre,
  mergeProductosVendidos,
  totalVasosGastadosCierre,
  type ProductoVendidoHistorial,
} from '@/lib/cierre/historial'
import { capitalizar, formatPesos } from '@/lib/utils'
import toast from 'react-hot-toast'
import { TabMovimientos } from '@/components/cierre/historial/TabMovimientos'
import { TabProductos } from '@/components/cierre/historial/TabProductos'
import { TabResumen } from '@/components/cierre/historial/TabResumen'
import { TabInventario } from '@/components/cierre/historial/TabInventario'
import type { CierreDia, Venta } from '@/types'

type TabHistorial = 'resumen' | 'productos' | 'vasos' | 'gastos'

const TABS: { id: TabHistorial; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'productos', label: 'Productos' },
  { id: 'vasos', label: 'Inventario' },
  { id: 'gastos', label: 'Movimientos' },
]

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
      const res = await fetch(`/api/ventas?desde=${cierre.fecha}&hasta=${cierre.fecha}`)
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
      ? 'bg-ok-soft text-ok'
      : estadoCuadre === 'falta'
        ? 'bg-bad-soft text-bad'
        : 'bg-warn-soft text-warn'

  const badgeTexto =
    estadoCuadre === 'perfecto'
      ? 'Cuadre perfecto'
      : estadoCuadre === 'falta'
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : `Sobran ${formatPesos(diferencia)}`

  const IconoCuadre =
    estadoCuadre === 'perfecto' ? CheckCircle2 : estadoCuadre === 'falta' ? XCircle : AlertCircle

  return (
    <motion.div
      layout="position"
      className="card hover:shadow-pop overflow-hidden transition-shadow"
    >
      <button
        type="button"
        onClick={toggleAbierto}
        aria-expanded={abierto}
        className="focus-ring hover:bg-bg-elevated/50 flex min-h-[76px] w-full items-center justify-between gap-3 p-4 text-left transition-colors sm:px-5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${badgeCuadre}`}
          >
            <IconoCuadre size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-text-primary text-base font-bold sm:text-lg">
              {capitalizar(format(parseISO(cierre.fecha), "EEEE d 'de' MMMM yyyy", { locale: es }))}
            </p>
            <p className="text-text-muted mt-0.5 text-xs">
              {cierre.usuario?.nombre ?? 'Sin responsable'}
              {cierre.estado === 'cerrado' ? ' · Cerrado' : ''}
              {cierre.estado !== 'cerrado' && (
                <span className="badge-warn ml-2 align-middle">En progreso</span>
              )}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
              {esAdmin && (
                <span className="text-brand text-sm font-semibold tabular-nums">
                  {formatPesos(cierre.total_ventas)}
                </span>
              )}
              <span className="text-text-muted text-xs tabular-nums">{vasosGastados} vasos</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeCuadre}`}>
                {badgeTexto}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            {esAdmin && (
              <p className="text-brand text-sm font-semibold tabular-nums">
                {formatPesos(cierre.total_ventas)}
              </p>
            )}
            <p className="text-text-muted text-xs tabular-nums">{vasosGastados} vasos</p>
          </div>
          <span
            className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline ${badgeCuadre}`}
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
            <div className="border-bg-border space-y-4 border-t p-4 sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1">
                  <div className="bg-bg-elevated inline-flex gap-1 rounded-[14px] p-1">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`focus-ring relative min-h-10 shrink-0 rounded-[10px] px-3.5 text-sm font-bold transition-colors ${
                          tab === t.id
                            ? 'text-text-primary'
                            : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {tab === t.id && (
                          <motion.span
                            layoutId={`tab-cierre-${cierre.id}`}
                            className="bg-bg-surface shadow-soft absolute inset-0 rounded-[10px]"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className="relative">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {esAdmin && (
                  <Link
                    href={`/dashboard/cierre?fecha=${cierre.fecha}`}
                    className="focus-ring border-bg-border bg-bg-surface text-text-primary hover:border-brand/40 hover:text-brand inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-[12px] border px-4 text-sm font-bold transition-colors md:w-auto"
                  >
                    <Pencil size={15} aria-hidden />
                    {cierre.estado === 'cerrado' ? 'Corregir este día' : 'Continuar este cierre'}
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
                  {tab === 'resumen' && <TabResumen cierre={cierre} esAdmin={esAdmin} />}
                  {tab === 'productos' && (
                    <TabProductos
                      items={productos}
                      cargando={cargandoProductos}
                      cierre={cierre}
                      esAdmin={esAdmin}
                    />
                  )}
                  {tab === 'vasos' && <TabInventario cierre={cierre} />}
                  {tab === 'gastos' && <TabMovimientos cierre={cierre} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
