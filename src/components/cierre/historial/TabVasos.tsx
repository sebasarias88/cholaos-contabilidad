'use client'

import { motion } from 'framer-motion'
import { formatTalla } from '@/lib/utils'
import type { CierreDia, ConteoVaso } from '@/types'

export function TabVasos({ cierre }: { cierre: CierreDia }) {
  const rows = cierre.conteo_vasos ?? []
  if (rows.length === 0) {
    return <p className="text-text-muted text-sm">Sin conteo de vasos.</p>
  }

  return (
    <motion.div layout className="space-y-3">
      <div className="text-text-muted hidden grid-cols-5 gap-2 text-xs md:grid">
        <span className="col-span-2">Talla</span>
        <span className="text-center">Inicio</span>
        <span className="text-center">Nuevos</span>
        <span className="text-right">Resultado</span>
      </div>

      {rows.map((conteo: ConteoVaso) => {
        const totalNovedades = conteo.novedades?.reduce((s, n) => s + n.cantidad, 0) ?? 0
        const gastados = Math.max(
          0,
          conteo.cantidad_inicio + conteo.cantidad_nuevos - (conteo.cantidad_final ?? 0)
        )
        const vendidos = Math.max(0, gastados - totalNovedades)
        const titulo = conteo.talla?.descripcion
          ? conteo.talla.descripcion
          : conteo.talla
            ? formatTalla(conteo.talla)
            : '—'

        return (
          <motion.div key={conteo.id} layout className="space-y-2">
            <div className="border-bg-border rounded-[var(--radius-md)] border px-3 py-2.5 md:hidden">
              <p className="text-text-primary text-sm">
                {titulo}
                {conteo.talla && (
                  <span className="text-text-muted ml-1 text-xs">{conteo.talla.onzas} oz</span>
                )}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-text-muted text-[10px] tracking-wide uppercase">Inicio</p>
                  <p className="text-text-secondary text-sm tabular-nums">
                    {conteo.cantidad_inicio}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] tracking-wide uppercase">Nuevos</p>
                  <p className="text-text-secondary text-sm tabular-nums">
                    +{conteo.cantidad_nuevos}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] tracking-wide uppercase">Vendidos</p>
                  <p className="text-accent-cyan text-sm font-medium tabular-nums">{vendidos}</p>
                </div>
              </div>
              {totalNovedades > 0 && (
                <p className="text-accent-amber mt-1.5 text-right text-xs tabular-nums">
                  {totalNovedades} novedades
                </p>
              )}
            </div>

            <div className="hidden grid-cols-5 gap-2 text-sm md:grid">
              <span className="text-text-primary col-span-2">
                {titulo}
                {conteo.talla && (
                  <span className="text-text-muted ml-1 text-xs">{conteo.talla.onzas}oz</span>
                )}
              </span>
              <span className="text-text-muted text-center tabular-nums">
                {conteo.cantidad_inicio}
              </span>
              <span className="text-text-muted text-center tabular-nums">
                +{conteo.cantidad_nuevos}
              </span>
              <div className="text-right">
                <span className="text-accent-cyan tabular-nums">{vendidos} vendidos</span>
                {totalNovedades > 0 && (
                  <span className="text-accent-amber block text-xs tabular-nums">
                    {totalNovedades} novedades
                  </span>
                )}
              </div>
            </div>

            {conteo.novedades && conteo.novedades.length > 0 && (
              <div className="border-bg-border ml-3 space-y-1 border-l-2 pl-3">
                {conteo.novedades.map((n, i) => (
                  <div
                    key={n.id ?? i}
                    className="text-text-muted flex justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0">
                      {n.motivo?.emoji}{' '}
                      {n.motivo?.descripcion === 'Otro'
                        ? n.motivo_custom || 'Otro'
                        : n.motivo?.descripcion}
                    </span>
                    <span className="text-accent-amber shrink-0 tabular-nums">−{n.cantidad}</span>
                  </div>
                ))}
              </div>
            )}

            {conteo.observacion && (
              <p className="text-text-muted ml-3 text-xs italic">
                &ldquo;{conteo.observacion}&rdquo;
              </p>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
