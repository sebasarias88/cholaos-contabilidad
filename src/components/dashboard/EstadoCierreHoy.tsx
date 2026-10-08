'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ClipboardList, PencilLine } from 'lucide-react'
import { formatPesos } from '@/lib/utils'
import type { CierreDia } from '@/types'

/** Tarjeta oscura con el estado del cierre de hoy */
export function EstadoCierreHoy({ cierre }: { cierre: CierreDia | null }) {
  const cerrado = cierre?.estado === 'cerrado'
  const enProgreso = cierre?.estado === 'borrador'
  const diferencia = Number(cierre?.diferencia ?? 0)

  const titulo = cerrado
    ? 'El día de hoy ya está cerrado'
    : enProgreso
      ? 'El cierre de hoy va en progreso'
      : 'Aún no se ha empezado el cierre de hoy'
  const detalle = cerrado
    ? diferencia === 0
      ? 'La caja cuadró perfecto.'
      : diferencia < 0
        ? `Faltaron ${formatPesos(-diferencia)} en caja.`
        : `Sobraron ${formatPesos(diferencia)} en caja.`
    : enProgreso
      ? 'Hay un avance guardado. Puedes continuarlo cuando quieras.'
      : 'Cuando termine la jornada, cuenta vasos, comida y caja.'
  const Icono = cerrado ? CheckCircle2 : enProgreso ? PencilLine : ClipboardList

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-cocoa text-cocoa-text relative overflow-hidden rounded-[24px] p-5 sm:p-6"
    >
      {/* Brillo decorativo */}
      <motion.div
        aria-hidden
        className="bg-brand/35 pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${
              cerrado ? 'bg-ok-solid text-white' : 'bg-brand text-white'
            }`}
          >
            <Icono size={28} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-cocoa-muted text-xs font-bold tracking-wider uppercase">
              Cierre de hoy
            </p>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">{titulo}</h2>
            <p className="text-cocoa-muted mt-0.5 text-sm">{detalle}</p>
          </div>
        </div>
        <Link
          href="/dashboard/cierre"
          className="focus-ring group bg-brand hover:bg-brand-strong inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] px-5 font-bold text-white transition-colors"
        >
          {cerrado ? 'Ver cierre' : enProgreso ? 'Continuar' : 'Empezar cierre'}
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>
    </motion.section>
  )
}
