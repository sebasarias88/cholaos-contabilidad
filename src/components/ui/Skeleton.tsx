'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <motion.div
      className={`rounded-[var(--radius-md)] bg-bg-elevated ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// Skeleton de tabla
export function SkeletonTabla({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: filas }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

// Skeleton de card de stat
export function SkeletonStat() {
  return (
    <div className="flex h-full min-h-[7.5rem] flex-col space-y-3 rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}
