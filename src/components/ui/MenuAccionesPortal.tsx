'use client'

import { createPortal } from 'react-dom'
import type { ReactNode, RefObject } from 'react'

interface MenuAccionesPortalProps {
  open: boolean
  position: { top: number; left: number } | null
  menuRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

export function MenuAccionesPortal({
  open,
  position,
  menuRef,
  children,
}: MenuAccionesPortalProps) {
  if (!open || !position || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[200] min-w-[10rem] rounded-[var(--radius-md)] border border-bg-border bg-bg-surface py-1 shadow-xl"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-100%)',
      }}
    >
      {children}
    </div>,
    document.body
  )
}
