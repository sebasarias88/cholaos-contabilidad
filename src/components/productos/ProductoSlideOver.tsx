'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { modalOverlay } from '@/lib/animations'
import { TIPOS_PRODUCTO } from '@/lib/productos-ui'
import type { Producto, TipoProducto } from '@/types'

export type VarianteFormDraft = {
  id?: string
  nombre: string
  precio: string
}

export type ProductoFormState = {
  nombre: string
  tipo: TipoProducto
  onzas: string
  unidad: string
  precio: string
  descripcion: string
  tiene_variantes: boolean
  variantes: VarianteFormDraft[]
}

interface ProductoSlideOverProps {
  open: boolean
  producto: Producto | null
  form: ProductoFormState
  guardando: boolean
  onClose: () => void
  onChange: (form: ProductoFormState) => void
  onSubmit: (e: React.FormEvent) => void
}

const fieldsMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

export function ProductoSlideOver({
  open,
  producto,
  form,
  guardando,
  onClose,
  onChange,
  onSubmit,
}: ProductoSlideOverProps) {
  function setTipo(tipo: TipoProducto) {
    onChange({
      ...form,
      tipo,
      onzas: tipo === 'vaso' ? form.onzas || '' : '',
      unidad: tipo === 'vaso' ? '' : form.unidad,
      precio: tipo === 'insumo' ? '' : form.precio,
      tiene_variantes: tipo === 'comida' ? form.tiene_variantes : false,
      variantes: tipo === 'comida' ? form.variantes : [],
    })
  }

  function setTieneVariantes(checked: boolean) {
    onChange({
      ...form,
      tiene_variantes: checked,
      precio: checked ? '' : form.precio,
      variantes: checked
        ? form.variantes.length > 0
          ? form.variantes
          : [{ nombre: '', precio: '' }]
        : [],
    })
  }

  function actualizarVariante(
    index: number,
    campo: 'nombre' | 'precio',
    valor: string
  ) {
    const variantes = form.variantes.map((v, i) =>
      i === index ? { ...v, [campo]: valor } : v
    )
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
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-bg-base/80"
            variants={modalOverlay}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-bg-border bg-bg-surface shadow-glow-cyan-strong"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'tween',
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-bg-border px-6 py-4">
              <h2 className="font-display text-lg font-bold text-text-primary">
                {producto ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="focus-ring-cyan rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-bg-elevated"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex flex-1 flex-col gap-5 overflow-y-auto p-6"
            >
              <Input
                label="Nombre"
                value={form.nombre}
                onChange={(e) => onChange({ ...form, nombre: e.target.value })}
                required
              />

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-text-secondary">
                  Tipo
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS_PRODUCTO.map((t) => {
                    const activo = form.tipo === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTipo(t.value)}
                        aria-pressed={activo}
                        className={[
                          'rounded-[var(--radius-md)] border p-3 text-left transition-all',
                          activo
                            ? 'border-accent-cyan bg-accent-cyan-dim'
                            : 'border-bg-border bg-bg-elevated hover:border-bg-border/60',
                        ].join(' ')}
                      >
                        <span className="mb-1 block text-xl" aria-hidden>
                          {t.emoji}
                        </span>
                        <span className="block text-sm font-medium text-text-primary">
                          {t.label}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-text-muted sm:text-xs">
                          {t.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <AnimatePresence mode="wait" initial={false}>
                {form.tipo === 'vaso' && (
                  <motion.div
                    key="vaso-fields"
                    {...fieldsMotion}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Input
                      label="Onzas"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="ej: 16"
                      value={form.onzas}
                      onChange={(e) =>
                        onChange({ ...form, onzas: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Precio (COP)"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={form.precio}
                      onChange={(e) =>
                        onChange({ ...form, precio: e.target.value })
                      }
                      required
                    />
                  </motion.div>
                )}

                {form.tipo === 'comida' && (
                  <motion.div
                    key="comida-fields"
                    {...fieldsMotion}
                    className="space-y-4"
                  >
                    <Input
                      label="Unidad"
                      placeholder="porción, unidad, ml..."
                      value={form.unidad}
                      onChange={(e) =>
                        onChange({ ...form, unidad: e.target.value })
                      }
                      required
                    />

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/40 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={form.tiene_variantes}
                        onChange={(e) => setTieneVariantes(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-bg-border accent-accent-cyan"
                      />
                      <span className="text-sm leading-snug text-text-secondary">
                        Tiene variantes de precio (Mesa, Para llevar, Paisa…)
                      </span>
                    </label>

                    {form.tiene_variantes ? (
                      <div className="space-y-2">
                        <p className="text-xs text-text-muted">
                          Define las variantes y su precio
                        </p>
                        {form.variantes.map((v, i) => (
                          <div key={v.id ?? `new-${i}`} className="flex items-center gap-2">
                            <input
                              value={v.nombre}
                              onChange={(e) =>
                                actualizarVariante(i, 'nombre', e.target.value)
                              }
                              placeholder="Nombre (ej: Mesa Paisa)"
                              className="input min-w-0 flex-1 text-sm"
                            />
                            <input
                              type="number"
                              min={0}
                              value={v.precio}
                              onChange={(e) =>
                                actualizarVariante(i, 'precio', e.target.value)
                              }
                              placeholder="Precio"
                              className="input w-24 shrink-0 text-sm tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => eliminarVariante(i)}
                              aria-label="Eliminar variante"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-muted hover:bg-accent-red-dim hover:text-accent-red"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={agregarVariante}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-cyan hover:underline"
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
                        onChange={(e) =>
                          onChange({ ...form, precio: e.target.value })
                        }
                        required
                      />
                    )}
                  </motion.div>
                )}

                {form.tipo === 'insumo' && (
                  <motion.div
                    key="insumo-fields"
                    {...fieldsMotion}
                    className="space-y-3"
                  >
                    <Input
                      label="Unidad"
                      placeholder="caja, kg, unidad..."
                      value={form.unidad}
                      onChange={(e) =>
                        onChange({ ...form, unidad: e.target.value })
                      }
                      required
                    />
                    <p className="rounded-[var(--radius-md)] border border-bg-border/80 bg-bg-elevated/40 px-3 py-2 text-xs leading-relaxed text-text-muted">
                      Los insumos no generan venta — solo se lleva conteo de
                      inventario.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="descripcion"
                  className="text-sm font-medium text-text-secondary"
                >
                  Descripción (opcional)
                </label>
                <textarea
                  id="descripcion"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) =>
                    onChange({ ...form, descripcion: e.target.value })
                  }
                  className="select-field resize-none"
                  placeholder="Notas del producto..."
                />
              </div>

              <div className="mt-auto flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={guardando}>
                  {guardando
                    ? 'Guardando...'
                    : producto
                      ? 'Actualizar'
                      : 'Crear'}
                </Button>
              </div>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
