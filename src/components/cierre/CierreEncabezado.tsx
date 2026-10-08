'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { CalendarDays, PencilLine } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CierreDiaApi } from '@/hooks/useCierreDia'
import { fechaComoDate, sumarDias } from '@/lib/fechas'
import { formatFecha, capitalizar } from '@/lib/utils'

/** Título, fecha del cierre (el admin la puede elegir), estado y avisos */
export function CierreEncabezado({ cierre, fecha }: { cierre: CierreDiaApi; fecha: string }) {
  const router = useRouter()
  const { datos, esAdmin, estadoCierre, esCorreccion, corrigiendo, hayCambios } = cierre
  const hoy = datos?.hoy ?? fecha
  const minimo = datos?.ultimo_cierre ? sumarDias(datos.ultimo_cierre, 1) : undefined
  const puedeElegirFecha = esAdmin && !esCorreccion

  function cambiarFecha(nueva: string) {
    if (!nueva || nueva === fecha) return
    if (hayCambios && !window.confirm('Tienes cambios sin guardar. ¿Cambiar de fecha igualmente?'))
      return
    router.push(nueva === hoy ? '/dashboard/cierre' : `/dashboard/cierre?fecha=${nueva}`)
  }

  const fechaCorta = capitalizar(format(fechaComoDate(fecha), "EEEE d 'de' MMMM", { locale: es }))

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-text-primary text-[28px] leading-tight font-extrabold sm:text-[32px]">
          Cierre del día
        </h1>

        {puedeElegirFecha ? (
          <label className="focus-within:border-brand focus-within:ring-brand/15 border-bg-border bg-bg-surface shadow-soft relative inline-flex min-h-11 items-center gap-2 rounded-[12px] border px-3 text-sm font-bold focus-within:ring-4">
            <CalendarDays size={18} className="text-brand" aria-hidden />
            <span className="sr-only">Fecha del cierre</span>
            <input
              type="date"
              value={fecha}
              min={minimo}
              max={hoy}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="text-text-primary bg-transparent font-bold outline-none"
            />
          </label>
        ) : (
          <span className="border-bg-border bg-bg-surface inline-flex min-h-11 items-center gap-2 rounded-[12px] border px-3 text-sm font-bold">
            <CalendarDays size={18} className="text-brand" aria-hidden />
            {fechaCorta}
          </span>
        )}

        {estadoCierre && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={estadoCierre === 'cerrado' ? 'badge-green py-1.5' : 'badge-warn py-1.5'}
          >
            <span
              className={`h-2 w-2 rounded-full ${estadoCierre === 'cerrado' ? 'bg-ok-solid' : 'bg-warn-solid animate-pulse'}`}
            />
            {estadoCierre === 'cerrado' ? 'Cerrado' : 'En progreso'}
            {cierre.ultimoGuardado && ` · guardado ${format(cierre.ultimoGuardado, 'h:mm a')}`}
          </motion.span>
        )}

        {esAdmin && esCorreccion && !corrigiendo && (
          <button
            type="button"
            onClick={() => cierre.setCorrigiendo(true)}
            className="focus-ring border-bg-border bg-bg-surface text-text-primary hover:border-brand/40 inline-flex min-h-10 items-center gap-2 rounded-[12px] border px-3 text-sm font-bold"
          >
            <PencilLine size={16} />
            Corregir cierre
          </button>
        )}

        {fecha !== hoy && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/cierre')}
            className="text-brand-strong text-sm font-bold hover:underline"
          >
            Ir al cierre de hoy
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 text-sm">
        {corrigiendo && (
          <p className="text-warn font-semibold">
            Estás corrigiendo un día ya cerrado. La fecha no cambia y no se recalculan los días
            siguientes.
          </p>
        )}
        {cierre.bloqueado && !esAdmin && (
          <p className="text-text-secondary">
            Este día ya se cerró. Solo el administrador puede corregirlo.
          </p>
        )}
        {!esCorreccion && datos?.fecha_anterior && (
          <p className="text-text-secondary">
            Inventario y base tomados del cierre del {formatFecha(datos.fecha_anterior)}.
          </p>
        )}
      </div>
    </header>
  )
}
