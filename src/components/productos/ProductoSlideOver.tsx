'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { modalOverlay } from '@/lib/animations'
import type { Producto } from '@/types'

const ONZAS_OPCIONES = [8, 12, 16, 20, 24] as const

export type ProductoFormState = {
  nombre: string
  onzas: number
  precio: string
  descripcion: string
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

export function ProductoSlideOver({
  open,
  producto,
  form,
  guardando,
  onClose,
  onChange,
  onSubmit,
}: ProductoSlideOverProps) {
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
            transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="flex items-center justify-between border-b border-bg-border px-6 py-4">
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
            </motion.div>

            <form
              onSubmit={onSubmit}
              className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
            >
              <Input
                label="Nombre"
                value={form.nombre}
                onChange={(e) =>
                  onChange({ ...form, nombre: e.target.value })
                }
                required
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="onzas" className="text-sm font-medium text-text-secondary">
                  Onzas
                </label>
                <select
                  id="onzas"
                  value={form.onzas}
                  onChange={(e) =>
                    onChange({ ...form, onzas: Number(e.target.value) })
                  }
                  className="select-field"
                  required
                >
                  {ONZAS_OPCIONES.map((oz) => (
                    <option key={oz} value={oz}>
                      {oz} oz
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Precio (COP)"
                type="number"
                min={0}
                step={1}
                value={form.precio}
                onChange={(e) =>
                  onChange({ ...form, precio: e.target.value })
                }
                required
              />

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
