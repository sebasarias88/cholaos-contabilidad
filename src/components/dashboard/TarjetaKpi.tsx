'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { NumeroAnimado } from '@/components/ui/NumeroAnimado'
import { fadeUp } from '@/lib/animations'

const TONOS = {
  brand: 'bg-brand-soft text-brand',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  cocoa: 'bg-bg-elevated text-text-primary',
}

export function TarjetaKpi({
  titulo,
  valor,
  formato = 'pesos',
  detalle,
  icono: Icono,
  tono = 'brand',
  className = '',
}: {
  titulo: string
  valor: number
  formato?: 'pesos' | 'numero'
  detalle?: string
  icono: LucideIcon
  tono?: keyof typeof TONOS
  className?: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className={`card hover:shadow-pop flex h-full flex-col gap-3 p-4 transition-shadow sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-secondary text-sm font-semibold">{titulo}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${TONOS[tono]}`}>
          <Icono size={18} aria-hidden />
        </span>
      </div>
      <NumeroAnimado
        valor={valor}
        formato={formato}
        className="font-display text-text-primary text-[22px] leading-none font-extrabold sm:text-[26px]"
      />
      <p className="text-text-muted min-h-5 text-xs font-medium">{detalle ?? ' '}</p>
    </motion.div>
  )
}
