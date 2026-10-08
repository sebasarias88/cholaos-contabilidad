export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-[var(--radius-md)] ${className}`} aria-hidden />
}

export function SkeletonTabla({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Cargando">
      {Array.from({ length: filas }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
