import type { ReactNode } from 'react'

/** Mensaje amable cuando no hay datos */
export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono?: ReactNode
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="border-bg-border bg-bg-surface/60 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed px-6 py-12 text-center">
      {icono && (
        <div className="bg-brand-soft text-brand flex h-14 w-14 items-center justify-center rounded-2xl">
          {icono}
        </div>
      )}
      <p className="font-display text-text-primary text-lg font-bold">{titulo}</p>
      {descripcion && <p className="text-text-secondary max-w-sm text-sm">{descripcion}</p>}
      {accion}
    </div>
  )
}
