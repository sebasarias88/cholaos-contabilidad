'use client'

import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import type { ProductoFormState } from '@/lib/productos/formulario'

const fieldsMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

export function CamposComida({
  form,
  onChange,
}: {
  form: ProductoFormState
  onChange: (form: ProductoFormState) => void
}) {
  function setTieneVariantes(checked: boolean) {
    onChange({
      ...form,
      tiene_variantes: checked,
      conteo_inventario: checked ? false : form.conteo_inventario,
      precio: checked ? '' : form.precio,
      variantes: checked
        ? form.variantes.length > 0
          ? form.variantes
          : [{ nombre: '', precio: '' }]
        : [],
    })
  }

  function actualizarVariante(index: number, campo: 'nombre' | 'precio', valor: string) {
    const variantes = form.variantes.map((v, i) => (i === index ? { ...v, [campo]: valor } : v))
    onChange({ ...form, variantes })
  }

  function eliminarVariante(index: number) {
    onChange({
      ...form,
      variantes: form.variantes.filter((_, i) => i !== index),
    })
  }

  function agregarVariante() {
    onChange({
      ...form,
      variantes: [...form.variantes, { nombre: '', precio: '' }],
    })
  }

  return (
    <motion.div key="comida-fields" {...fieldsMotion} className="space-y-4">
      <Input
        label="Unidad"
        placeholder="porción, unidad, ml..."
        value={form.unidad}
        onChange={(e) => onChange({ ...form, unidad: e.target.value })}
        required
      />

      <label className="border-bg-border bg-bg-elevated/40 flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border px-3 py-3">
        <input
          type="checkbox"
          checked={form.tiene_variantes}
          onChange={(e) => setTieneVariantes(e.target.checked)}
          className="border-bg-border mt-0.5 h-4 w-4 rounded accent-[var(--brand)]"
        />
        <span className="text-text-secondary text-sm leading-snug">
          Tiene variantes de precio (Mesa, Para llevar, Paisa…)
        </span>
      </label>

      {!form.tiene_variantes && (
        <label className="border-bg-border bg-bg-elevated/40 flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border px-3 py-3">
          <input
            type="checkbox"
            checked={form.conteo_inventario}
            onChange={(e) => onChange({ ...form, conteo_inventario: e.target.checked })}
            className="border-bg-border mt-0.5 h-4 w-4 rounded accent-[var(--brand)]"
          />
          <span className="text-text-secondary text-sm leading-snug">
            <span className="text-text-primary font-bold">Contar como los vasos</span> — en el
            cierre se anota cuántas había, cuántas llegaron y cuántas quedan; lo vendido se calcula
            solo (ej. gaseosas, agua).
          </span>
        </label>
      )}

      {form.tiene_variantes ? (
        <div className="space-y-2">
          <p className="text-text-muted text-xs">Define las variantes y su precio</p>
          {form.variantes.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="flex items-center gap-2">
              <input
                value={v.nombre}
                onChange={(e) => actualizarVariante(i, 'nombre', e.target.value)}
                placeholder="Nombre (ej: Mesa Paisa)"
                className="input min-w-0 flex-1 text-sm"
              />
              <input
                type="number"
                min={0}
                value={v.precio}
                onChange={(e) => actualizarVariante(i, 'precio', e.target.value)}
                placeholder="Precio"
                className="input w-24 shrink-0 text-sm tabular-nums"
              />
              <button
                type="button"
                onClick={() => eliminarVariante(i)}
                aria-label="Eliminar variante"
                className="text-text-muted hover:bg-bad-soft hover:text-bad flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={agregarVariante}
            className="text-brand inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <Plus size={12} aria-hidden />
            Agregar variante
          </button>
        </div>
      ) : (
        <Input
          label="Precio (COP)"
          type="number"
          min={0}
          step={1}
          placeholder="Precio único"
          value={form.precio}
          onChange={(e) => onChange({ ...form, precio: e.target.value })}
          required
        />
      )}
    </motion.div>
  )
}
