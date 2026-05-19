'use client'

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

interface AnimatedPageProps {
  children: React.ReactNode
  className?: string
}

/** Wrapper para transiciones de página — usar dentro de AnimatePresence si hay exit */
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
    >
      {children}
    </motion.div>
  )
}
