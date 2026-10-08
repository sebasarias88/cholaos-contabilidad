'use client'

import { motion } from 'framer-motion'

/** Transición suave al cambiar de página (solo opacidad: no rompe elementos fijos) */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
