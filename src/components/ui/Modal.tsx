'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
const ANCHO = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-xl' }

/** Ventana centrada en escritorio; hoja inferior en celular */
export function Modal({ open, onClose, title, description, size = 'md', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || !panelRef.current) return
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled')
      )
    const inicial =
      panel.querySelector<HTMLElement>('[autofocus]') ?? focusables()[1] ?? focusables()[0]
    inicial?.focus()

    const trap = (e: KeyboardEvent) => {
      const lista = focusables()
      if (e.key !== 'Tab' || lista.length === 0) return
      const first = lista[0]
      const last = lista[lista.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener('keydown', trap)
    return () => panel.removeEventListener('keydown', trap)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            tabIndex={-1}
            className="bg-cocoa/45 absolute inset-0 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={`bg-bg-surface shadow-pop relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-[28px] sm:rounded-[24px] ${ANCHO[size]}`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <div
              className="bg-bg-border mx-auto mt-2.5 h-1.5 w-10 rounded-full sm:hidden"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4 px-6 pt-4 sm:pt-6">
              {title && (
                <div className="min-w-0">
                  <h2 id={titleId} className="font-display text-text-primary text-xl font-bold">
                    {title}
                  </h2>
                  {description && <p className="text-text-secondary mt-1 text-sm">{description}</p>}
                </div>
              )}
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="focus-ring text-text-secondary hover:bg-bg-elevated hover:text-text-primary -mr-2 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="scroll-touch min-h-0 flex-1 px-6 pt-4 pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
