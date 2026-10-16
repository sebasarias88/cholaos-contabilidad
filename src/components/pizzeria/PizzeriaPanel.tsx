'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CalendarDays, Pizza, Save } from 'lucide-react'
import { NovedadesDrawer } from '@/components/cierre/NovedadesDrawer'
import { HistorialPizzeria } from '@/components/pizzeria/HistorialPizzeria'
import { TablaPizzeria, type CampoPizza } from '@/components/pizzeria/TablaPizzeria'
import { Button } from '@/components/ui/Button'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  erroresPizzeria,
  filasPizzeria,
  payloadPizzeria,
  totalNovedadesPizza,
  vendidasPizza,
  type FilaPizza,
} from '@/lib/pizzeria'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import { formatFecha } from '@/lib/utils'
import type { DatosPizzeria, NovedadVasoInput } from '@/types'

function horaCorta(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(iso))
}

/** Página del pizzero: masas y unidades del día con sus novedades (no entra en la caja) */
export function PizzeriaPanel({ fecha, esAdmin }: { fecha: string; esAdmin: boolean }) {
  const router = useRouter()
  const [datos, setDatos] = useState<DatosPizzeria | null>(null)
  const [filas, setFilas] = useState<FilaPizza[]>([])
  const [guardadoJson, setGuardadoJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)
  const [novedadesDe, setNovedadesDe] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    fetch(`/api/masas?fecha=${fecha}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error ?? 'Error cargando la pizzería')
        return body as DatosPizzeria
      })
      .then((d) => {
        if (cancelado) return
        const iniciales = filasPizzeria(d)
        setDatos(d)
        setFilas(iniciales)
        setGuardadoJson(JSON.stringify(iniciales))
        setError(null)
      })
      .catch((e: Error) => !cancelado && setError(e.message))
    return () => {
      cancelado = true
    }
  }, [fecha, version])

  const hayCambios = datos !== null && JSON.stringify(filas) !== guardadoJson
  const errores = useMemo(() => erroresPizzeria(filas), [filas])
  const totalVendidas = filas.reduce((s, f) => s + vendidasPizza(f), 0)
  const totalNovedades = filas.reduce((s, f) => s + totalNovedadesPizza(f), 0)
  const esHoy = datos ? fecha === datos.hoy : true

  // Avisar antes de salir con cambios sin guardar
  useEffect(() => {
    if (!hayCambios) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambios])

  const cambiar = useCallback(
    (productoId: string, campo: CampoPizza, valor: number | null) =>
      setFilas((fs) =>
        fs.map((f) => (f.producto_id === productoId ? { ...f, [campo]: valor } : f))
      ),
    []
  )
  const cambiarNovedades = useCallback(
    (productoId: string, novedades: NovedadVasoInput[]) =>
      setFilas((fs) => fs.map((f) => (f.producto_id === productoId ? { ...f, novedades } : f))),
    []
  )

  async function guardar() {
    if (errores.length > 0) {
      toastError(errores[0])
      return
    }
    setGuardando(true)
    const id = toastLoading('Guardando...')
    try {
      const res = await fetch('/api/masas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPizzeria(fecha, filas)),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'No se pudo guardar')
      toastSuccess('Pizzería guardada', id)
      setVersion((v) => v + 1)
    } catch (e) {
      toastError((e as Error).message || 'Sin conexión. Intenta de nuevo.', id)
    } finally {
      setGuardando(false)
    }
  }

  const filaNovedades = filas.find((f) => f.producto_id === novedadesDe) ?? null
  const registro = datos?.registro ?? null

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo="Pizzería"
        descripcion="Masas y unidades de pizza del día, con sus novedades. No entra en la caja."
        acciones={
          esAdmin ? (
            <label className="border-bg-border bg-bg-surface flex min-h-11 items-center gap-2 rounded-[12px] border px-3">
              <CalendarDays size={17} className="text-brand shrink-0" aria-hidden />
              <span className="sr-only">Día</span>
              <input
                type="date"
                value={fecha}
                max={datos?.hoy}
                onChange={(e) =>
                  e.target.value && router.push(`/dashboard/pizzeria?fecha=${e.target.value}`)
                }
                className="text-text-primary min-w-0 bg-transparent text-sm font-bold outline-none"
              />
            </label>
          ) : (
            <span className="badge-brand inline-flex items-center gap-1.5">
              <CalendarDays size={13} aria-hidden />
              Hoy
            </span>
          )
        }
      />

      {error ? (
        <p className="border-bad/30 bg-bad-soft text-bad rounded-[var(--radius-lg)] border p-5 font-semibold">
          {error}
        </p>
      ) : !datos ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[20px]" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <EstadoVacio
          icono={<Pizza size={26} />}
          titulo="No hay productos de pizzería"
          descripcion="El admin puede crearlos en Productos con el tipo «Masa de pizza»."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {!esHoy && <span className="badge-warn">Corrigiendo el {formatFecha(fecha)}</span>}
            <span className="text-text-secondary">
              {registro
                ? `Guardado a las ${horaCorta(registro.updated_at)}${
                    registro.usuario?.nombre ? ` por ${registro.usuario.nombre}` : ''
                  }`
                : datos.fecha_anterior
                  ? `"Empezó con" viene de lo que terminó el ${formatFecha(datos.fecha_anterior)}`
                  : 'Aún no se ha guardado este día'}
            </span>
          </div>

          <div className="@container min-w-0">
            <TablaPizzeria filas={filas} onChange={cambiar} onAbrirNovedades={setNovedadesDe} />
          </div>

          {/* Barra para guardar: fija abajo en celular, al final en computador */}
          <div className="h-24 md:hidden" aria-hidden />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-cocoa text-cocoa-text fixed inset-x-0 bottom-0 z-30 rounded-t-[24px] px-4 pt-3 pb-[calc(0.9rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_rgb(42_26_18/0.2)] md:static md:z-auto md:rounded-[var(--radius-lg)] md:p-4 md:shadow-none"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-cocoa-muted truncate text-xs font-semibold">
                  {hayCambios
                    ? 'Hay cambios sin guardar'
                    : registro
                      ? 'Todo guardado'
                      : 'Sin guardar'}
                </p>
                <p className="truncate text-sm font-extrabold sm:text-base">
                  {totalVendidas} vendida{totalVendidas === 1 ? '' : 's'}
                  {totalNovedades > 0 &&
                    ` · ${totalNovedades} novedad${totalNovedades === 1 ? '' : 'es'}`}
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                loading={guardando}
                disabled={guardando || (!hayCambios && registro !== null)}
                onClick={() => void guardar()}
                className="shrink-0"
              >
                <Save size={18} aria-hidden />
                Guardar
              </Button>
            </div>
          </motion.div>

          <HistorialPizzeria hasta={fecha} esAdmin={esAdmin} recargar={version} />
        </>
      )}

      <NovedadesDrawer
        open={!!filaNovedades}
        titulo={filaNovedades?.producto.nombre ?? ''}
        unidad="unidades"
        novedades={filaNovedades?.novedades ?? []}
        motivos={datos?.motivos ?? []}
        onClose={() => setNovedadesDe(null)}
        onChange={(n) => novedadesDe && cambiarNovedades(novedadesDe, n)}
      />
    </div>
  )
}
