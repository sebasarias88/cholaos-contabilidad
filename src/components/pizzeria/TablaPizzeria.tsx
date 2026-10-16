'use client'

import { motion } from 'framer-motion'
import { CampoNumero } from '@/components/cierre/TarjetaConteo'
import { CheckAnimado } from '@/components/ui/CheckAnimado'
import {
  filaPizzaIncompleta,
  salieronPizza,
  totalNovedadesPizza,
  vendidasPizza,
  type FilaPizza,
} from '@/lib/pizzeria'

export type CampoPizza = 'cantidad_inicio' | 'cantidad_final' | 'numero_masas'

/**
 * Masas y unidades de pizza: con cuántas empezó y terminó, el número de masas
 * (Pizzeta, Mediana, Familiar) y las novedades. Vendidas = salieron − novedades.
 */
export function TablaPizzeria({
  filas,
  disabled = false,
  onChange,
  onAbrirNovedades,
}: {
  filas: FilaPizza[]
  disabled?: boolean
  onChange: (productoId: string, campo: CampoPizza, valor: number | null) => void
  onAbrirNovedades: (productoId: string) => void
}) {
  return (
    <ul className="grid gap-4 @3xl:grid-cols-2 @[96rem]:grid-cols-4">
      {filas.map((fila, i) => {
        const conMasas = Boolean(fila.producto.lleva_masas)
        const completa = !filaPizzaIncompleta(fila)
        const salieron = salieronPizza(fila)
        const novedades = totalNovedadesPizza(fila)
        const exceso =
          fila.cantidad_inicio !== null &&
          fila.cantidad_final !== null &&
          fila.cantidad_final > fila.cantidad_inicio
        const sobranNovedades = !exceso && salieron !== null && novedades > salieron
        const error = exceso || sobranNovedades
        const vendidas = vendidasPizza(fila)
        return (
          <motion.li
            key={fila.producto_id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={[
              'bg-bg-surface shadow-soft @container flex flex-col gap-4 rounded-[var(--radius-lg)] border p-4 sm:p-5',
              error ? 'border-bad/50' : completa ? 'border-bg-border' : 'border-brand/25',
            ].join(' ')}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <p className="font-display text-text-primary min-w-0 flex-1 basis-32 text-lg leading-tight font-bold">
                {fila.producto.nombre}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAbrirNovedades(fila.producto_id)}
                  className={[
                    'focus-ring min-h-9 rounded-[10px] border px-2.5 text-xs font-bold transition-colors',
                    novedades > 0
                      ? 'border-warn-solid/60 bg-warn-soft text-warn'
                      : 'border-bg-border text-text-secondary hover:border-warn-solid/60 hover:text-warn',
                  ].join(' ')}
                >
                  {novedades > 0 ? `${novedades} novedad${novedades === 1 ? '' : 'es'}` : 'Novedad'}
                </button>
                {error ? (
                  <span className="badge-bad">Revisar</span>
                ) : completa ? (
                  <CheckAnimado />
                ) : (
                  <span className="badge-brand">Falta anotar</span>
                )}
              </div>
            </div>

            <div
              className={`grid gap-2 sm:gap-3 ${
                conMasas ? 'grid-cols-2 @[22rem]:grid-cols-4' : 'grid-cols-3'
              }`}
            >
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
              {conMasas && (
                <CampoNumero
                  etiqueta="Masas"
                  valor={fila.numero_masas}
                  onChange={(n) => onChange(fila.producto_id, 'numero_masas', n)}
                  disabled={disabled}
                  resaltar={fila.numero_masas === null}
                />
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-text-secondary text-xs font-bold">Vendidas</span>
                <motion.span
                  key={`${vendidas}-${error}`}
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  className={`flex h-12 items-center justify-center rounded-[12px] text-xl font-extrabold tabular-nums ${
                    error
                      ? 'bg-bad-soft text-bad'
                      : salieron === null
                        ? 'bg-bg-elevated text-text-secondary'
                        : 'bg-ok-soft text-ok'
                  }`}
                >
                  {error ? '!' : salieron === null ? '—' : vendidas}
                </motion.span>
              </div>
            </div>

            {exceso && (
              <p className="text-bad -mt-1 text-xs font-bold">Terminó con más de las que empezó.</p>
            )}
            {sobranNovedades && (
              <p className="text-bad -mt-1 text-xs font-bold">
                Hay {novedades} novedades y solo salieron {salieron}.
              </p>
            )}
            {!error && novedades > 0 && salieron !== null && (
              <p className="text-text-secondary -mt-1 text-xs">
                Salieron {salieron}: {vendidas} vendida{vendidas === 1 ? '' : 's'} y {novedades} de
                novedades.
              </p>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}
