'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { InputPeso } from '@/components/ui/InputPeso'
import { Select } from '@/components/ui/Select'
import type { MedioTransferencia } from '@/types'

type Props =
  | {
      tipo: 'gasto' | 'domicilio'
      onAgregar: (descripcion: string, monto: number) => void
    }
  | {
      tipo: 'transferencia'
      medios: MedioTransferencia[]
      onAgregar: (medioId: string, nombre: string, monto: number) => void
    }

const PLACEHOLDER = {
  gasto: 'Ej. gasolina, mercado…',
  domicilio: 'Detalle (opcional)',
}

const ETIQUETA = {
  gasto: 'Agregar gasto',
  domicilio: 'Agregar domicilio',
  transferencia: 'Agregar transferencia',
}

/** Fila para agregar un gasto, transferencia o domicilio */
export function NuevoMovimiento(props: Props) {
  const [texto, setTexto] = useState('')
  const [monto, setMonto] = useState(0)

  const valido = monto > 0 && (props.tipo === 'domicilio' || texto.trim().length > 0)

  function agregar() {
    if (!valido) return
    if (props.tipo === 'transferencia') {
      const medio = props.medios.find((m) => m.id === texto)
      if (!medio) return
      props.onAgregar(medio.id, medio.nombre, monto)
    } else {
      props.onAgregar(texto.trim(), monto)
    }
    setTexto('')
    setMonto(0)
  }

  function onEnter(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    agregar()
  }

  if (props.tipo === 'transferencia' && props.medios.length === 0) {
    return (
      <p className="text-text-secondary text-xs">
        No hay medios configurados. El admin puede agregarlos en Configuración → Transferencias.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {props.tipo === 'transferencia' ? (
        <Select
          value={texto}
          onChange={setTexto}
          placeholder="Medio…"
          aria-label="Medio de transferencia"
          options={props.medios.map((m) => ({ value: m.id, label: m.nombre }))}
        />
      ) : (
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onEnter}
          placeholder={PLACEHOLDER[props.tipo]}
          aria-label="Descripción"
          className="input placeholder:text-text-secondary min-w-0 flex-1"
        />
      )}
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
        aria-label={ETIQUETA[props.tipo]}
        disabled={!valido}
        className="bg-brand-soft text-brand hover:bg-brand/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  )
}
