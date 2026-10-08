'use client'

import { TarjetaConteo } from '@/components/cierre/TarjetaConteo'
import type { FilaInsumo } from '@/lib/cierre/estado'

function consumidos(fila: FilaInsumo) {
  if (fila.cantidad_final === null) return 0
  return Math.max(0, fila.cantidad_inicio + (fila.cantidad_nuevos ?? 0) - fila.cantidad_final)
}

export function TablaInsumos({
  filas,
  disabled = false,
  onChange,
}: {
  filas: FilaInsumo[]
  disabled?: boolean
  onChange: <K extends keyof FilaInsumo>(productoId: string, campo: K, valor: FilaInsumo[K]) => void
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {filas.map((fila) => {
        const resultado = consumidos(fila)
        return (
          <TarjetaConteo
            key={fila.producto_id}
            titulo={fila.producto.nombre}
            subtitulo={fila.producto.unidad ?? undefined}
            inicio={fila.cantidad_inicio}
            nuevos={fila.cantidad_nuevos}
            final={fila.cantidad_final}
            disabled={disabled}
            etiquetaResultado="Consumidos"
            resultado={resultado}
            claseResultado={resultado > 0 ? 'text-text-secondary' : 'text-text-muted'}
            onNuevos={(n) => onChange(fila.producto_id, 'cantidad_nuevos', n)}
            onFinal={(n) => onChange(fila.producto_id, 'cantidad_final', n)}
          />
        )
      })}
    </ul>
  )
}
