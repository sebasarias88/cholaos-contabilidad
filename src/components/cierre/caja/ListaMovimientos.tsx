'use client'

import { AnimatePresence } from 'framer-motion'
import {
  FilaMovimientoEditable,
  FilaMovimientoLectura,
  type EdicionMovimiento,
  type ItemMovimiento,
} from '@/components/cierre/caja/FilaMovimiento'

export function ListaMovimientos({
  items,
  bloqueado,
  edicion,
  onEliminar,
}: {
  items: ItemMovimiento[]
  bloqueado: boolean
  edicion: EdicionMovimiento
  onEliminar: (id: string) => void
}) {
  if (items.length === 0) {
    return <p className="text-text-secondary py-2 text-xs">Sin registros aún</p>
  }
  return (
    <AnimatePresence initial={false}>
      {items.map((item) =>
        bloqueado ? (
          <FilaMovimientoLectura key={item.id} item={item} />
        ) : (
          <FilaMovimientoEditable
            key={item.id}
            item={item}
            edicion={edicion}
            onEliminar={() => onEliminar(item.id)}
          />
        )
      )}
    </AnimatePresence>
  )
}
