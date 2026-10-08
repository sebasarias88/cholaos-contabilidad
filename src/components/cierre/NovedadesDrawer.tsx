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
            className="border-bg-border bg-bg-surface/95 shadow-glow-cyan-strong relative z-10 flex max-h-[min(80dvh,28rem)] w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-lg)] border backdrop-blur-xl"
            variants={modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-bg-border flex shrink-0 items-center justify-between border-b px-5 py-4">
              <div className="min-w-0">
                <p className="text-text-secondary text-[10px] font-medium tracking-wide uppercase">
                  Novedades
                </p>
                <p className="text-text-primary truncate text-sm font-semibold">{titulo}</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="text-text-muted hover:bg-bg-elevated hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
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
