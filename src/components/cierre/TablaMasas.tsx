'use client'

import { motion } from 'framer-motion'
import { CampoNumero } from '@/components/cierre/TarjetaConteo'
import { CheckAnimado } from '@/components/ui/CheckAnimado'
import { masasUsadas, type FilaMasa } from '@/lib/cierre/estado'

/** Masas de pizza: con cuántas empezó y con cuántas terminó (no suma a las ventas) */
export function TablaMasas({
  filas,
  disabled = false,
  onChange,
}: {
  filas: FilaMasa[]
  disabled?: boolean
  onChange: (
    productoId: string,
    campo: 'cantidad_inicio' | 'cantidad_final',
    valor: number | null
  ) => void
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {filas.map((fila, i) => {
        const completa = fila.cantidad_inicio !== null && fila.cantidad_final !== null
        const error = completa && fila.cantidad_final! > fila.cantidad_inicio!
        const usadas = masasUsadas(fila)
        return (
          <motion.li
            key={fila.producto_id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={[
              'bg-bg-surface shadow-soft flex flex-col gap-4 rounded-[var(--radius-lg)] border p-4 sm:p-5',
              error ? 'border-bad/50' : completa ? 'border-bg-border' : 'border-brand/25',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-text-primary text-lg leading-tight font-bold">
                {fila.producto.nombre}
              </p>
              {completa && !error ? (
                <CheckAnimado />
              ) : (
                <span className={error ? 'badge-bad' : 'badge-brand'}>
                  {error ? 'Revisar' : 'Falta anotar'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <CampoNumero
                etiqueta="Empezó con"
                valor={fila.cantidad_inicio}
                onChange={(n) => onChange(fila.producto_id, 'cantidad_inicio', n)}
                disabled={disabled}
                resaltar={fila.cantidad_inicio === null}
              />
              <CampoNumero
                etiqueta="Terminó con"
                valor={fila.cantidad_final}
                onChange={(n) => onChange(fila.producto_id, 'cantidad_final', n)}
                disabled={disabled}
                resaltar={fila.cantidad_final === null}
              />
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-text-secondary text-xs font-bold">Usadas</span>
                <motion.span
                  key={`${usadas}-${error}`}
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  className={`flex h-12 items-center justify-center rounded-[12px] text-xl font-extrabold tabular-nums ${
                    error ? 'bg-bad-soft text-bad' : 'bg-warn-soft text-warn'
                  }`}
                >
                  {completa ? (error ? '!' : usadas) : '—'}
                </motion.span>
              </div>
            </div>

            {error && (
              <p className="text-bad -mt-1 text-xs font-bold">
                Terminó con más masas de las que empezó.
              </p>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}
