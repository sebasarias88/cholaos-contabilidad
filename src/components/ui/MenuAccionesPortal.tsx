'use client'

import { createPortal } from 'react-dom'
import type { ReactNode, RefObject } from 'react'

interface MenuAccionesPortalProps {
  open: boolean
  position: { top: number; left: number } | null
  menuRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

/** Menú flotante anclado al botón de acciones (se usa con useMenuAcciones) */
export function MenuAccionesPortal({ open, position, menuRef, children }: MenuAccionesPortalProps) {
  if (!open || !position || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="border-bg-border bg-bg-surface fixed z-[200] min-w-[11rem] rounded-[var(--radius-md)] border py-1 shadow-xl"
      style={{ top: position.top, left: position.left, transform: 'translateX(-100%)' }}
    >
      {children}
    </div>,
    document.body
  )
}

const TONOS = {
  normal: 'text-text-primary hover:bg-bg-elevated',
  peligro: 'text-accent-red hover:bg-accent-red-dim',
  exito: 'text-accent-green hover:bg-bg-elevated',
}

export function MenuItem({
  children,
  onClick,
  tono = 'normal',
}: {
  children: ReactNode
  onClick: () => void
  tono?: keyof typeof TONOS
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm ${TONOS[tono]}`}
    >
      {children}
    </button>
  )
}

export function MenuSeparador() {
  return <div className="border-bg-border my-1 border-t" role="separator" />
}
