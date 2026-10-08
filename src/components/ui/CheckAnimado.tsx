'use client'

import { motion } from 'framer-motion'

/** Círculo verde con una palomita que se dibuja */
export function CheckAnimado({ tamano = 26 }: { tamano?: number }) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="bg-ok-soft text-ok inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: tamano, height: tamano }}
      aria-hidden
    >
      <svg width={tamano * 0.55} height={tamano * 0.55} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  )
}
