'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CantidadStepper } from '@/components/ventas/CantidadStepper'
import { modalOverlay } from '@/lib/animations'
import { formatPesos } from '@/lib/utils'
import type { Producto } from '@/types'

export type ItemCierre = {
  producto: Producto
  cantidad: number
  subtotal: number
}

interface CierreBottomSheetProps {
  open: boolean
  onClose: () => void
  items: ItemCierre[]
  total: number
  totalVasos: number
  observaciones: string
  onObservacionesChange: (value: string) => void
  onCantidadChange: (productoId: string, cantidad: number) => void
  onConfirmar: () => void
  guardando: boolean
}

export function CierreBottomSheet({
  open,
  onClose,
  items,
  total,
  totalVasos,
  observaciones,
  onObservacionesChange,
  onCantidadChange,
  onConfirmar,
  guardando,
}: CierreBottomSheetProps) {
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
          className="fixed inset-0 z-50 lg:hidden"
          data-lenis-prevent
        >
          <motion.button
            type="button"
            aria-label="Cerrar resumen"
            className="absolute inset-0 z-0 bg-bg-base/85 backdrop-blur-sm"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => !guardando && onClose()}
          />

          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="cierre-sheet-title"
            data-lenis-prevent
            className="absolute inset-x-0 bottom-0 z-10 flex h-[92dvh] max-h-[92dvh] flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-bg-border border-b-0 bg-bg-surface shadow-glow-cyan-strong"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-bg-border" aria-hidden />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-bg-border px-5 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-cyan-dim text-accent-cyan">
                  <ShoppingBag size={20} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2
                    id="cierre-sheet-title"
                    className="font-display text-lg font-bold text-text-primary"
                  >
                    Tu cierre
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {totalVasos} vaso{totalVasos !== 1 ? 's' : ''} ·{' '}
                    {items.length} producto{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                disabled={guardando}
                className="focus-ring-cyan shrink-0 rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-bg-elevated"
              >
                <X size={22} />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="scroll-touch min-h-0 flex-1 px-5 py-4"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <ul className="space-y-3 pb-1">
                {items.map(({ producto, cantidad, subtotal }) => (
                  <li
                    key={producto.id}
                    className="rounded-[var(--radius-lg)] border border-bg-border bg-bg-elevated/40 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium capitalize text-text-primary">
                          {producto.nombre}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {producto.onzas} oz · {formatPesos(producto.precio)} c/u
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-accent-cyan tabular-nums">
                        {formatPesos(subtotal)}
                      </p>
                    </div>
                    <CantidadStepper
                      size="sm"
                      value={cantidad}
                      onChange={(n) => onCantidadChange(producto.id, n)}
                      aria-label={`Cantidad ${producto.nombre} ${producto.onzas} oz`}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="shrink-0 space-y-3 border-t border-bg-border bg-bg-surface px-5 pt-4"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <Input
                label="Observaciones (opcional)"
                value={observaciones}
                onChange={(e) => onObservacionesChange(e.target.value)}
                placeholder="Ej. Turno tarde, lluvia..."
                disabled={guardando}
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">Total del cierre</span>
                <span className="font-display text-2xl font-bold text-accent-cyan tabular-nums">
                  {formatPesos(total)}
                </span>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={guardando || items.length === 0}
                loading={guardando}
                onClick={onConfirmar}
              >
                Confirmar y registrar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
