'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ChevronDown, Pencil, XCircle } from 'lucide-react'
import {
  getDiferenciaCierre,
  getEstadoCuadre,
  mergeProductosVendidos,
  totalVasosGastadosCierre,
  type ProductoVendidoHistorial,
} from '@/lib/cierre/historial'
import { formatFecha, formatPesos } from '@/lib/utils'
import toast from 'react-hot-toast'
import { TabMovimientos } from '@/components/cierre/historial/TabMovimientos'
import { TabProductos } from '@/components/cierre/historial/TabProductos'
import { TabResumen } from '@/components/cierre/historial/TabResumen'
import { TabVasos } from '@/components/cierre/historial/TabVasos'
import type { CierreDia, Venta } from '@/types'

type TabHistorial = 'resumen' | 'productos' | 'vasos' | 'gastos'

const TABS: { id: TabHistorial; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'productos', label: 'Productos' },
  { id: 'vasos', label: 'Vasos' },
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
    estadoCuadre === 'perfecto' ? CheckCircle2 : estadoCuadre === 'falta' ? XCircle : AlertCircle

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
        className="hover:bg-bg-elevated/40 flex w-full items-center justify-between gap-3 p-4 text-left transition-colors"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`bg-bg-elevated flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconoColor}`}
          >
            <IconoCuadre size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-text-primary text-base font-semibold tracking-tight">
              {formatFecha(cierre.fecha)}
            </p>
            <p className="text-text-muted mt-0.5 text-xs">
              {cierre.usuario?.nombre ?? 'Sin responsable'}
              {cierre.estado === 'cerrado' ? ' · Cerrado' : ' · En progreso'}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
              {esAdmin && (
                <span className="text-accent-cyan text-sm font-semibold tabular-nums">
                  {formatPesos(cierre.total_ventas)}
                </span>
              )}
              <span className="text-text-muted text-xs tabular-nums">{vasosGastados} vasos</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeCuadre}`}>
                {badgeTexto}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            {esAdmin && (
              <p className="text-accent-cyan text-sm font-semibold tabular-nums">
                {formatPesos(cierre.total_ventas)}
              </p>
            )}
            <p className="text-text-muted text-xs tabular-nums">{vasosGastados} vasos</p>
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
            <div className="border-bg-border space-y-4 border-t p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="md:bg-bg-elevated -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 md:mx-0 md:overflow-visible md:rounded-[var(--radius-md)] md:p-1">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={[
                        'shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors md:flex-1 md:rounded-[var(--radius-sm)] md:px-3 md:py-2',
                        tab === t.id
                          ? 'bg-bg-surface text-text-primary ring-bg-border font-medium shadow-sm ring-1 md:ring-0'
                          : 'bg-bg-elevated text-text-muted hover:text-text-secondary md:bg-transparent',
                      ].join(' ')}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {esAdmin && (
                  <Link
                    href={`/dashboard/cierre?fecha=${cierre.fecha}`}
                    className="border-bg-border text-text-secondary hover:border-accent-cyan/40 hover:text-text-primary inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-2.5 text-xs font-medium transition-colors md:w-auto md:py-2"
                  >
                    <Pencil size={13} aria-hidden />
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
                  {tab === 'vasos' && <TabVasos cierre={cierre} />}
                  {tab === 'gastos' && <TabMovimientos cierre={cierre} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
