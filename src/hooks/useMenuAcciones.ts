'use client'

import { useEffect, useRef, useState } from 'react'

export function useMenuAcciones() {
  const [menuId, setMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  )
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuId) return

    function cerrar() {
      setMenuId(null)
      setMenuPos(null)
    }

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if ((target as Element).closest?.('[data-menu-accion]')) return
      cerrar()
    }

    function onScroll() {
      cerrar()
    }

    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [menuId])

  function toggle(id: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (menuId === id) {
      setMenuId(null)
      setMenuPos(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right })
    setMenuId(id)
  }

  function close() {
    setMenuId(null)
    setMenuPos(null)
  }

  return { menuId, menuPos, menuRef, toggle, close, isOpen: (id: string) => menuId === id }
}
