'use client'

import { ProductoSwitch } from '@/components/productos/ProductoSwitch'
import { BADGE_TIPO, tipoProducto } from '@/lib/productos-ui'
import { formatPesos } from '@/lib/utils'
import type { Producto, TipoProducto } from '@/types'

export function BadgeTipo({ tipo }: { tipo: TipoProducto }) {
  const badge = BADGE_TIPO[tipo]
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
        badge.className,
      ].join(' ')}
    >
      {badge.label}
    </span>
  )
}

export function ProductoEstado({
  producto,
  onToggle,
}: {
  producto: Producto
  onToggle: () => void
}) {
  return (
    <ProductoSwitch
      active={producto.activo}
      onChange={onToggle}
      aria-label={producto.activo ? 'Desactivar producto' : 'Activar producto'}
    />
  )
}

export function ProductoPrecio({
  producto,
  editingPrecioId,
  precioDraft,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  inputClassName = 'select-field w-28 tabular-nums',
}: {
  producto: Producto
  editingPrecioId: string | null
  precioDraft: string
  onStartEdit: () => void
  onDraftChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  inputClassName?: string
}) {
  const tipo = tipoProducto(producto)

  if (tipo === 'insumo') {
    return <span className="text-text-muted tabular-nums">—</span>
  }

  if (producto.tiene_variantes) {
    const activas = (producto.variantes ?? []).filter((v) => v.activo)
    if (activas.length === 0) {
      return <span className="text-text-muted text-xs">Sin variantes</span>
    }
    const precios = activas.map((v) => v.precio)
    const min = Math.min(...precios)
    const max = Math.max(...precios)
    return (
      <span
        className="text-accent-cyan inline-block text-sm font-medium whitespace-nowrap tabular-nums"
        title={activas.map((v) => `${v.nombre}: ${formatPesos(v.precio)}`).join(' · ')}
      >
        {min === max ? formatPesos(min) : `${formatPesos(min)} – ${formatPesos(max)}`}
      </span>
    )
  }

  if (editingPrecioId === producto.id) {
    return (
      <input
        type="number"
        min={0}
        step={1}
        autoFocus
        value={precioDraft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSave()
          }
          if (e.key === 'Escape') onCancel()
        }}
        className={inputClassName}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      className="text-accent-cyan font-medium tabular-nums underline-offset-2 hover:underline"
      title="Click para editar precio"
    >
      {formatPesos(producto.precio ?? 0)}
    </button>
  )
}
