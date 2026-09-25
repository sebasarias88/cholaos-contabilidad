'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { modalOverlay } from '@/lib/animations'
import { TIPOS_PRODUCTO } from '@/lib/productos-ui'
import { etiquetaTipoVaso, formatTalla } from '@/lib/utils'
import type { Producto, TallaVaso, TipoProducto, TipoVaso } from '@/types'

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
  /** '' = crear vaso nuevo; uuid = reutilizar talla existente */
  talla_id: string
  tipo_vaso: TipoVaso
  talla_descripcion: string
}

interface ProductoSlideOverProps {
  open: boolean
  producto: Producto | null
  form: ProductoFormState
  tallas: TallaVaso[]
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
  tallas,
  guardando,
  onClose,
  onChange,
  onSubmit,
}: ProductoSlideOverProps) {
  const creandoTallaNueva = form.tipo === 'vaso' && !form.talla_id

  const opcionesTalla = [
    { value: '', label: '+ Crear vaso físico nuevo…' },
    ...tallas
      .filter((t) => t.activo)
      .map((t) => ({
        value: t.id,
        label: t.descripcion?.trim()
          ? `${t.descripcion} · ${formatTalla(t)}`
          : formatTalla(t),
      })),
  ]

  function setTipo(tipo: TipoProducto) {
    onChange({
      ...form,
      tipo,
      onzas: tipo === 'vaso' ? form.onzas || '' : '',
      unidad: tipo === 'vaso' ? '' : form.unidad,
      precio: tipo === 'insumo' ? '' : form.precio,
      tiene_variantes: tipo === 'comida' ? form.tiene_variantes : false,
      variantes: tipo === 'comida' ? form.variantes : [],
      talla_id: tipo === 'vaso' ? form.talla_id : '',
      tipo_vaso: form.tipo_vaso,
      talla_descripcion: form.talla_descripcion,
    })
  }

  function setTallaId(tallaId: string) {
    if (!tallaId) {
      onChange({
        ...form,
        talla_id: '',
        onzas: form.onzas || '',
      })
      return
    }
    const talla = tallas.find((t) => t.id === tallaId)
    onChange({
      ...form,
      talla_id: tallaId,
      onzas: talla ? String(talla.onzas) : form.onzas,
      tipo_vaso: talla?.tipo ?? form.tipo_vaso,
      talla_descripcion: talla?.descripcion ?? form.talla_descripcion,
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

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

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
            className="relative z-10 flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden border-l border-bg-border bg-bg-surface shadow-glow-cyan-strong md:h-full md:max-h-none"
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
            <div className="flex shrink-0 items-center justify-between border-b border-bg-border px-6 py-4">
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
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div
                data-lenis-prevent
                className="scroll-touch min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5"
              >
                <div className="flex flex-col gap-5">
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
                            : 'border-bg-border bg-bg-elevated hover:border-accent-cyan/30',
                        ].join(' ')}
                      >
                        <span className="mb-1 block text-xl" aria-hidden>
                          {t.emoji}
                        </span>
                        <span className="block text-sm font-medium text-text-primary">
                          {t.label}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-text-secondary sm:text-xs">
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
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-secondary">
                        Vaso físico (conteo compartido)
                      </label>
                      <Select
                        value={form.talla_id}
                        onChange={setTallaId}
                        options={opcionesTalla}
                        placeholder="Seleccionar vaso…"
                        aria-label="Vaso físico"
                      />
                      <p className="text-xs leading-relaxed text-text-muted">
                        Varios productos pueden usar el mismo vaso (ej. 14 oz
                        ancho → Cholao, Milo, Malteadas). El conteo del cierre
                        es por vaso; el precio va por producto.
                      </p>
                    </div>

                    {creandoTallaNueva ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Onzas"
                          type="number"
                          min={1}
                          step={1}
                          placeholder="ej: 14"
                          value={form.onzas}
                          onChange={(e) =>
                            onChange({ ...form, onzas: e.target.value })
                          }
                          required
                        />
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-text-secondary">
                            Forma
                          </label>
                          <Select
                            value={form.tipo_vaso}
                            onChange={(v) =>
                              onChange({
                                ...form,
                                tipo_vaso: v as TipoVaso,
                              })
                            }
                            options={[
                              { value: 'normal', label: etiquetaTipoVaso('normal') },
                              { value: 'ancho', label: etiquetaTipoVaso('ancho') },
                              {
                                value: 'angosto',
                                label: etiquetaTipoVaso('angosto'),
                              },
                            ]}
                            aria-label="Forma del vaso"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            label="Nombre del vaso (opcional)"
                            placeholder="ej: 14 oz ancho"
                            value={form.talla_descripcion}
                            onChange={(e) =>
                              onChange({
                                ...form,
                                talla_descripcion: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/50 px-3 py-2 text-xs text-text-secondary">
                        Onzas:{' '}
                        <span className="font-medium text-text-primary tabular-nums">
                          {form.onzas || '—'} oz
                        </span>
                        {form.tipo_vaso !== 'normal' && (
                          <>
                            {' '}
                            · {etiquetaTipoVaso(form.tipo_vaso)}
                          </>
                        )}
                      </p>
                    )}

                    <Input
                      label="Precio de este producto (COP)"
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
                    <p className="rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/50 px-3 py-2 text-xs leading-relaxed text-text-secondary">
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
                </div>
              </div>

              <div className="flex shrink-0 gap-3 border-t border-bg-border bg-bg-surface px-6 py-4">
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
