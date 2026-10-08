'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo } from 'react'

const COLORES = ['#D14A1F', '#F5A524', '#2E8B57', '#C8202B', '#FFB27A', '#7FD3A0']

/**
 * Celebración al cerrar el día: confeti con los colores de la marca
 * y un mensaje. Se cierra sola o con un toque.
 */
export function Celebracion({
  abierta,
  titulo,
  detalle,
  onCerrar,
}: {
  abierta: boolean
  titulo: string
  detalle?: string
  onCerrar: () => void
}) {
  const reducir = useReducedMotion()

  const piezas = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => {
        const angulo = (i / 46) * Math.PI * 2 + (i % 3) * 0.2
        const distancia = 160 + ((i * 37) % 180)
        return {
          id: i,
          x: Math.cos(angulo) * distancia,
          y: Math.sin(angulo) * distancia - 60,
          rot: ((i * 53) % 360) - 180,
          color: COLORES[i % COLORES.length],
          redonda: i % 3 === 0,
          retraso: (i % 6) * 0.015,
        }
      }),
    []
  )

  useEffect(() => {
    if (!abierta) return
    const t = setTimeout(onCerrar, 3200)
    return () => clearTimeout(t)
  }, [abierta, onCerrar])

  return (
    <AnimatePresence>
      {abierta && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
          role="status"
          aria-live="polite"
        >
          <div className="bg-bg-base/70 absolute inset-0 backdrop-blur-sm" />
          {!reducir &&
            piezas.map((p) => (
              <motion.span
                key={p.id}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: p.redonda ? 12 : 9,
                  height: p.redonda ? 12 : 16,
                  borderRadius: p.redonda ? 999 : 3,
                  background: p.color,
                }}
                initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: p.x,
                  y: [0, p.y, p.y + 260],
                  scale: 1,
                  rotate: p.rot * 3,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.9, delay: p.retraso, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          <motion.div
            className="bg-bg-surface shadow-pop relative mx-6 flex flex-col items-center gap-3 rounded-[28px] px-10 py-8 text-center"
            initial={{ scale: 0.6, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
          >
            <motion.div
              className="bg-ok-solid flex h-20 w-20 items-center justify-center rounded-full text-white"
              initial={{ rotate: -30 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 12 }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden>
                <motion.path
                  d="m5 12.5 4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 0.25 }}
                />
              </svg>
            </motion.div>
            <p className="font-display text-text-primary text-2xl font-extrabold">{titulo}</p>
            {detalle && <p className="text-text-secondary text-[15px] font-semibold">{detalle}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
