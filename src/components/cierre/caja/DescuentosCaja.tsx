'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Plus, X } from 'lucide-react'
import { InputPeso } from '@/components/ui/InputPeso'
import { SelectorPersona, type PersonaElegida } from '@/components/descuentos/SelectorPersona'
import { usePersonasDescuento } from '@/hooks/usePersonasDescuento'
import { formatPesos } from '@/lib/utils'
import type { CierreDiaApi } from '@/hooks/useCierreDia'
import type { LineaDescuento } from '@/lib/cierre/estado'

const animacion = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
}

/** Agregar y editar descuentos: persona + concepto + monto */
export function DescuentosCaja({ cierre }: { cierre: CierreDiaApi }) {
  const { estado, bloqueado, movimientos } = cierre
  const { personas, crear } = usePersonasDescuento(!bloqueado)

  return (
    <>
      {!bloqueado && (
        <NuevoDescuento
          personas={personas}
          onCrear={crear}
          onAgregar={movimientos.agregarDescuento}
        />
      )}
      {estado.descuentos.length === 0 ? (
        <p className="text-text-secondary py-2 text-xs">Sin registros aún</p>
      ) : (
        <AnimatePresence initial={false}>
          {estado.descuentos.map((d) =>
            bloqueado || d.liquidado ? (
              <FilaDescuentoLectura key={d.id} descuento={d} />
            ) : (
              <motion.div
                key={d.id}
                {...animacion}
                className="flex flex-wrap items-center gap-2 @lg:flex-nowrap"
              >
                <SelectorPersona
                  value={{ id: d.persona_id, nombre: d.persona_nombre }}
                  onChange={(p) =>
                    movimientos.editarDescuento(d.id, {
                      persona_id: p.id,
                      persona_nombre: p.nombre,
                    })
                  }
                  personas={personas}
                  onCrear={crear}
                  className="w-full @lg:w-44 @lg:shrink-0"
                />
                <input
                  value={d.descripcion}
                  onChange={(e) =>
                    movimientos.editarDescuento(d.id, { descripcion: e.target.value })
                  }
                  placeholder="Concepto (opcional)"
                  aria-label="Concepto"
                  className="input placeholder:text-text-secondary min-w-0 flex-1"
                />
                <InputPeso
                  value={d.monto}
                  onChange={(monto) => movimientos.editarDescuento(d.id, { monto })}
                  className="input w-[6.75rem] shrink-0 tabular-nums sm:w-[7.5rem]"
                />
                <button
                  type="button"
                  onClick={() => movimientos.quitarDescuento(d.id)}
                  aria-label="Eliminar"
                  className="text-text-secondary hover:bg-bad-soft hover:text-bad flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors"
                >
                  <X size={16} aria-hidden />
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      )}
    </>
  )
}

function NuevoDescuento({
  personas,
  onCrear,
  onAgregar,
}: {
  personas: Parameters<typeof SelectorPersona>[0]['personas']
  onCrear: Parameters<typeof SelectorPersona>[0]['onCrear']
  onAgregar: (persona: PersonaElegida, descripcion: string, monto: number) => void
}) {
  const [persona, setPersona] = useState<PersonaElegida | null>(null)
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState(0)
  const valido = persona !== null && monto > 0

  function agregar() {
    if (!valido || !persona) return
    onAgregar(persona, concepto.trim(), monto)
    setPersona(null)
    setConcepto('')
    setMonto(0)
  }

  function onEnter(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    agregar()
  }

  return (
    <div className="bg-bg-elevated/60 flex flex-wrap items-center gap-2 rounded-[14px] p-2 @lg:flex-nowrap">
      <SelectorPersona
        value={persona}
        onChange={setPersona}
        personas={personas}
        onCrear={onCrear}
        aria-label="Persona del descuento"
        className="w-full @lg:w-44 @lg:shrink-0"
      />
      <input
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        onKeyDown={onEnter}
        placeholder="Concepto: gaseosa, préstamo…"
        aria-label="Concepto"
        className="input placeholder:text-text-secondary min-w-0 flex-1"
      />
      <InputPeso
        value={monto}
        onChange={setMonto}
        placeholder="Monto $"
        className="input placeholder:text-text-secondary w-28 shrink-0 tabular-nums sm:w-[7.5rem]"
        onKeyDown={onEnter}
      />
      <button
        type="button"
        onClick={agregar}
        aria-label="Agregar descuento"
        disabled={!valido}
        className="bg-brand-soft text-brand hover:bg-brand/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  )
}

function FilaDescuentoLectura({ descuento: d }: { descuento: LineaDescuento }) {
  return (
    <motion.div {...animacion} className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="text-text-primary font-bold">{d.persona_nombre || 'Sin persona'}</span>
        {d.descripcion.trim() && (
          <span className="text-text-secondary"> · {d.descripcion.trim()}</span>
        )}
      </span>
      {d.liquidado && (
        <span
          className="badge-green inline-flex shrink-0 items-center gap-1"
          title="Ya se descontó del sueldo: no se puede cambiar"
        >
          <Lock size={11} aria-hidden />
          Descontado
        </span>
      )}
      <span className="text-text-primary shrink-0 text-sm font-semibold tabular-nums">
        {formatPesos(d.monto)}
      </span>
    </motion.div>
  )
}
