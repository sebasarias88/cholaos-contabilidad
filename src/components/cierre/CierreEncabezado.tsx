'use client'

import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CierreDiaApi } from '@/hooks/useCierreDia'
import { sumarDias } from '@/lib/fechas'
import { formatFecha } from '@/lib/utils'

/** Fecha del cierre, estado y avisos */
export function CierreEncabezado({ cierre, fecha }: { cierre: CierreDiaApi; fecha: string }) {
  const router = useRouter()
  const { datos, esAdmin, estadoCierre, esCorreccion, corrigiendo, hayCambios } = cierre
  const hoy = datos?.hoy ?? fecha
  const minimo = datos?.ultimo_cierre ? sumarDias(datos.ultimo_cierre, 1) : undefined
  const puedeElegirFecha = esAdmin && !esCorreccion

  function cambiarFecha(nueva: string) {
    if (!nueva || nueva === fecha) return
    if (
      hayCambios &&
      !window.confirm('Tienes cambios sin guardar. ¿Cambiar de fecha igualmente?')
    ) {
      return
    }
    router.push(nueva === hoy ? '/dashboard/cierre' : `/dashboard/cierre?fecha=${nueva}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {puedeElegirFecha ? (
          <label className="border-bg-border bg-bg-surface inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-1.5 text-sm">
            <CalendarDays size={16} className="text-accent-cyan" aria-hidden />
            <span className="text-text-secondary">Fecha del cierre</span>
            <input
              type="date"
              value={fecha}
              min={minimo}
              max={hoy}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="text-text-primary bg-transparent font-medium outline-none"
              aria-label="Fecha del cierre"
            />
          </label>
        ) : (
          <span className="text-text-primary inline-flex items-center gap-2 text-sm font-medium">
            <CalendarDays size={16} className="text-accent-cyan" aria-hidden />
            {formatFecha(fecha)}
          </span>
        )}

        {estadoCierre === 'borrador' && <span className="badge-cyan">En progreso</span>}
        {estadoCierre === 'cerrado' && <span className="badge-green">Cerrado</span>}

        {esAdmin && esCorreccion && !corrigiendo && (
          <button
            type="button"
            className="border-bg-border text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] border px-3 py-1 text-xs font-medium"
            onClick={() => cierre.setCorrigiendo(true)}
          >
            Corregir cierre
          </button>
        )}

        {fecha !== hoy && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/cierre')}
            className="text-accent-cyan text-xs font-medium hover:underline"
          >
            Ir al cierre de hoy
          </button>
        )}

        {cierre.vasosVendidos > 0 && (
          <span className="text-text-secondary ml-auto text-xs">
            Vasos vendidos:{' '}
            <span className="text-accent-cyan font-medium tabular-nums">
              {cierre.vasosVendidos}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs">
        {corrigiendo && (
          <span className="text-amber-400">
            Editando un cierre ya hecho. La fecha no cambia; al guardar se reemplazan los datos de
            este día.
          </span>
        )}
        {cierre.bloqueado && !esAdmin && (
          <span className="text-text-muted">
            Este día ya se cerró. Solo el administrador puede corregirlo.
          </span>
        )}
        {!esCorreccion && datos?.fecha_anterior && (
          <span className="text-text-secondary">
            Inventario y base inicial tomados del cierre del {formatFecha(datos.fecha_anterior)}.
          </span>
        )}
        {cierre.ultimoGuardado && (
          <span className="text-text-secondary">
            Último guardado: {format(cierre.ultimoGuardado, 'h:mm a')}
          </span>
        )}
      </div>
    </div>
  )
}
