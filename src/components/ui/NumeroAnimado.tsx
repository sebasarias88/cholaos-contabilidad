'use client'

import { animate, useMotionValue, useReducedMotion, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'
import { formatPesos } from '@/lib/utils'

/** Número que sube/baja suavemente hasta su valor (pesos o cantidad) */
export function NumeroAnimado({
  valor,
  formato = 'numero',
  className,
}: {
  valor: number
  formato?: 'pesos' | 'numero'
  className?: string
}) {
  const reducir = useReducedMotion()
  const mv = useMotionValue(reducir ? valor : 0)
  const texto = useTransform(mv, (v) => {
    const n = Math.round(v)
    return formato === 'pesos' ? formatPesos(n) : n.toLocaleString('es-CO')
  })

  useEffect(() => {
    if (reducir) {
      mv.set(valor)
      return
    }
    const control = animate(mv, valor, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })
    return () => control.stop()
  }, [valor, mv, reducir])

  return <motion.span className={`tabular-nums ${className ?? ''}`}>{texto}</motion.span>
}
