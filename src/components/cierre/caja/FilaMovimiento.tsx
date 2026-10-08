'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { InputPeso } from '@/components/ui/InputPeso'
import { Select } from '@/components/ui/Select'
import { formatPesos } from '@/lib/utils'
import type { MedioTransferencia } from '@/types'

export type ItemMovimiento = {
  id: string
  etiqueta: string
  monto: number
  medioId?: string
}

export type EdicionMovimiento =
  | {
      tipo: 'texto'
      placeholder: string
      onChange: (id: string, descripcion: string, monto: number) => void
    }
  | {
      tipo: 'medio'
      medios: MedioTransferencia[]
      onChange: (id: string, medioId: string, nombre: string, monto: number) => void
    }

const animacion = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
}

/** Movimiento editable (día abierto) */
export function FilaMovimientoEditable({
  item,
  edicion,
  onEliminar,
}: {
  item: ItemMovimiento
  edicion: EdicionMovimiento
  onEliminar: () => void
}) {
  // Si el medio fue desactivado después, se sigue mostrando en la fila
  const medios =
    edicion.tipo === 'medio'
      ? [
          ...edicion.medios.map((m) => ({ id: m.id, nombre: m.nombre })),
          ...(item.medioId && !edicion.medios.some((m) => m.id === item.medioId)
            ? [{ id: item.medioId, nombre: item.etiqueta || 'Medio' }]
            : []),
        ]
      : []

  function cambiarMonto(monto: number) {
    if (edicion.tipo === 'texto') edicion.onChange(item.id, item.etiqueta, monto)
    else edicion.onChange(item.id, item.medioId ?? '', item.etiqueta, monto)
  }

  return (
    <motion.div {...animacion} className="flex items-center gap-2">
      {edicion.tipo === 'texto' ? (
        <input
          value={item.etiqueta}
          onChange={(e) => edicion.onChange(item.id, e.target.value, item.monto)}
          placeholder={edicion.placeholder}
          aria-label="Descripción"
          className="input placeholder:text-text-secondary min-w-0 flex-1"
        />
      ) : (
        <Select
          value={item.medioId ?? ''}
          onChange={(medioId) => {
            const medio = medios.find((m) => m.id === medioId)
            edicion.onChange(item.id, medioId, medio?.nombre ?? item.etiqueta, item.monto)
          }}
          placeholder="Medio…"
          aria-label="Medio de transferencia"
          options={medios.map((m) => ({ value: m.id, label: m.nombre }))}
        />
      )}
      <InputPeso
        value={item.monto}
        onChange={cambiarMonto}
        className="input w-[6.75rem] shrink-0 tabular-nums sm:w-[7.5rem]"
      />
      <button
        type="button"
        onClick={onEliminar}
        aria-label="Eliminar"
        className="text-text-secondary hover:bg-bad-soft hover:text-bad flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors"
      >
        <X size={16} aria-hidden />
      </button>
    </motion.div>
  )
}

/** Movimiento de solo lectura (día cerrado) */
export function FilaMovimientoLectura({ item }: { item: ItemMovimiento }) {
  return (
    <motion.div {...animacion} className="flex items-center justify-between py-2">
      <span className="text-text-secondary min-w-0 flex-1 truncate text-sm">
        {item.etiqueta.trim() || 'Sin detalle'}
      </span>
      <span className="text-text-primary shrink-0 text-sm font-semibold tabular-nums">
        {formatPesos(item.monto)}
      </span>
    </motion.div>
  )
}
