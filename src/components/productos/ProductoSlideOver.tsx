'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { modalOverlay } from '@/lib/animations'
import { TIPOS_PRODUCTO } from '@/lib/productos-ui'
import type { Producto, TallaVaso, TipoProducto } from '@/types'
import { CamposComida } from '@/components/productos/campos/CamposComida'
import { CamposInsumo } from '@/components/productos/campos/CamposInsumo'
import { CamposVaso } from '@/components/productos/campos/CamposVaso'
import type { ProductoFormState } from '@/lib/productos/formulario'

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
            className="bg-bg-base/80 absolute inset-0"
            variants={modalOverlay}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal
            className="border-bg-border bg-bg-surface shadow-glow-cyan-strong relative z-10 flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden border-l md:h-full md:max-h-none"
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
            <div className="border-bg-border flex shrink-0 items-center justify-between border-b px-6 py-4">
              <h2 className="font-display text-text-primary text-lg font-bold">
                {producto ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="focus-ring-cyan text-text-secondary hover:bg-bg-elevated rounded-[var(--radius-md)] p-2"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="scroll-touch min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                <div className="flex flex-col gap-5">
                  <Input
                    label="Nombre"
                    value={form.nombre}
                    onChange={(e) => onChange({ ...form, nombre: e.target.value })}
                    required
                  />

                  <fieldset className="space-y-2">
                    <legend className="text-text-secondary text-sm font-medium">Tipo</legend>
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
                            <span className="text-text-primary block text-sm font-medium">
                              {t.label}
                            </span>
                            <span className="text-text-secondary mt-0.5 block text-[10px] leading-snug sm:text-xs">
                              {t.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>

                  <AnimatePresence mode="wait" initial={false}>
                    {form.tipo === 'vaso' && (
                      <CamposVaso form={form} tallas={tallas} onChange={onChange} />
                    )}
                    {form.tipo === 'comida' && <CamposComida form={form} onChange={onChange} />}
                    {form.tipo === 'insumo' && <CamposInsumo form={form} onChange={onChange} />}
                  </AnimatePresence>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="descripcion"
                      className="text-text-secondary text-sm font-medium"
                    >
                      Descripción (opcional)
                    </label>
                    <textarea
                      id="descripcion"
                      rows={3}
                      value={form.descripcion}
                      onChange={(e) => onChange({ ...form, descripcion: e.target.value })}
                      className="select-field resize-none"
                      placeholder="Notas del producto..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-bg-border bg-bg-surface flex shrink-0 gap-3 border-t px-6 py-4">
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
                  {guardando ? 'Guardando...' : producto ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
