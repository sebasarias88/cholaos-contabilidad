'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Título de página con descripción y acciones a la derecha */
export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string
  descripcion?: ReactNode
  acciones?: ReactNode
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="font-display text-text-primary text-[28px] leading-tight font-extrabold sm:text-[32px]">
          {titulo}
        </h1>
        {descripcion && <p className="text-text-secondary mt-1 text-[15px]">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </motion.header>
  )
}
