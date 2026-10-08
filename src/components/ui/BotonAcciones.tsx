'use client'

import { MoreHorizontal } from 'lucide-react'

/** Botón "⋯" que abre el menú de acciones de una fila */
export function BotonAcciones({
  abierto,
  onClick,
}: {
  abierto: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      data-menu-accion
      aria-label="Acciones"
      aria-haspopup="menu"
      aria-expanded={abierto}
      onClick={onClick}
      className="focus-ring text-text-secondary hover:bg-bg-elevated hover:text-text-primary inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
    >
      <MoreHorizontal size={18} />
    </button>
  )
}
