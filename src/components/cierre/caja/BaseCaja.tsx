'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Lock } from 'lucide-react'
import { ConfirmarModal } from '@/components/ui/ConfirmarModal'
import { InputPeso } from '@/components/ui/InputPeso'
import { retiroBase } from '@/lib/cierre/base'
import { formatPesos } from '@/lib/utils'
import type { CierreDiaApi } from '@/hooks/useCierreDia'

/**
 * Base de anoche + base nueva (si el dueño sacó o metió plata).
 * El admin edita las dos. El empleado escribe la base nueva una sola vez:
 * al guardarla queda bloqueada.
 */
export function BaseCaja({ cierre }: { cierre: CierreDiaApi }) {
  const { estado, bloqueado, esAdmin, baseNuevaGuardada, actualizar, guardando } = cierre
  const [confirmar, setConfirmar] = useState(false)

  const bloqueadaEmpleado = !esAdmin && baseNuevaGuardada
  const retiro = retiroBase({ base_anterior: estado.dineroBase, base_nueva: estado.baseNueva })

  async function guardarBase() {
    const ok = await cierre.guardar(false)
    if (ok) setConfirmar(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-bold">Base de anoche</span>
          <InputPeso
            value={estado.dineroBase}
            onChange={(n) => actualizar({ dineroBase: n })}
            disabled={bloqueado || !esAdmin}
            className="input w-full text-lg font-bold tabular-nums"
          />
        </label>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="base-nueva" className="text-text-secondary text-xs font-bold">
            Base nueva <span className="text-text-muted font-semibold">(si cambió)</span>
          </label>
          <div className="relative">
            <InputPeso
              id="base-nueva"
              value={estado.baseNueva ?? 0}
              onChange={(n) => actualizar({ baseNueva: n > 0 ? n : null })}
              disabled={bloqueado || bloqueadaEmpleado}
              placeholder="Igual"
              className={`input w-full text-lg font-bold tabular-nums ${bloqueadaEmpleado ? 'pr-10' : ''}`}
            />
            {bloqueadaEmpleado && (
              <Lock
                size={16}
                className="text-text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
                aria-label="Base guardada"
              />
            )}
          </div>
          <AnimatePresence initial={false}>
            {!esAdmin && !bloqueado && !bloqueadaEmpleado && estado.baseNueva !== null && (
              <motion.button
                key="guardar-base"
                type="button"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmar(true)}
                className="focus-ring bg-brand hover:bg-brand-strong flex min-h-10 items-center justify-center gap-1.5 rounded-[12px] px-3 text-sm font-extrabold text-white"
              >
                <Lock size={14} aria-hidden />
                Guardar base nueva
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {retiro !== 0 && (
          <motion.p
            key="retiro"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-1.5 overflow-hidden text-xs font-bold ${
              retiro > 0 ? 'text-warn' : 'text-ok'
            }`}
          >
            {retiro > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {retiro > 0
              ? `Se sacaron ${formatPesos(retiro)} de la base`
              : `Se metieron ${formatPesos(-retiro)} a la base`}
          </motion.p>
        )}
      </AnimatePresence>
      {bloqueadaEmpleado && (
        <p className="text-text-muted text-xs font-semibold">
          Base nueva guardada. Solo el administrador puede cambiarla.
        </p>
      )}

      <ConfirmarModal
        open={confirmar}
        titulo="Guardar base nueva"
        textoConfirmar="Guardar base"
        variante="primary"
        cargando={guardando !== null}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => void guardarBase()}
      >
        La base nueva queda en{' '}
        <strong className="text-text-primary">{formatPesos(estado.baseNueva ?? 0)}</strong>
        {retiro > 0 && <> (se sacaron {formatPesos(retiro)})</>}. Después de guardarla no la podrás
        cambiar; solo el administrador puede hacerlo.
      </ConfirmarModal>
    </div>
  )
}
