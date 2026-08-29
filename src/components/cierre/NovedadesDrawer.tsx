'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { NovedadesVaso } from '@/components/cierre/NovedadesVaso'
import { modalContent, modalOverlay } from '@/lib/animations'
import type { MotivoNovedad, NovedadVasoInput } from '@/types'

interface NovedadesDrawerProps {
  open: boolean
  titulo: string
  novedades: NovedadVasoInput[]
  motivos: MotivoNovedad[]
  disabled?: boolean
  onClose: () => void
  onChange: (novedades: NovedadVasoInput[]) => void
}

export function NovedadesDrawer({
  open,
  titulo,
  novedades,
  motivos,
  disabled = false,
  onClose,
  onChange,
}: NovedadesDrawerProps) {
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            type="button"
            aria-label="Cerrar novedades"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={modalOverlay}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-label={`Novedades — ${titulo}`}
            className="relative z-10 flex max-h-[min(80dvh,28rem)] w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface/95 shadow-glow-cyan-strong backdrop-blur-xl"
            variants={modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-bg-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                  Novedades
                </p>
                <p className="truncate text-sm font-semibold text-text-primary">
                  {titulo}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <div
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
            >
              <NovedadesVaso
                novedades={novedades}
                motivos={motivos}
                disabled={disabled}
                onChange={onChange}
              />
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
