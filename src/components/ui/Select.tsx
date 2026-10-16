'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

/**
 * Pega un menú flotante al campo. Si abajo no cabe (campo al final de la pantalla,
 * típico en celular), lo abre hacia arriba.
 */
export function posicionarMenu(
  menu: HTMLElement,
  rect: DOMRect,
  opciones: { maxAlto?: number; anchoMin?: number } = {}
) {
  const maxAlto = opciones.maxAlto ?? 256
  const margen = 8
  const altoPantalla = window.visualViewport?.height ?? window.innerHeight
  const anchoPantalla = window.visualViewport?.width ?? window.innerWidth
  const altoContenido = Math.min(menu.scrollHeight, maxAlto)
  const abajo = altoPantalla - rect.bottom - margen
  const arriba = rect.top - margen
  const haciaArriba = abajo < altoContenido && arriba > abajo

  const disponible = Math.max(120, Math.min(maxAlto, haciaArriba ? arriba : abajo))
  menu.style.maxHeight = `${disponible}px`
  const alto = Math.min(altoContenido, disponible)
  menu.style.top = haciaArriba
    ? `${Math.max(margen, rect.top - 4 - alto)}px`
    : `${rect.bottom + 4}px`

  const ancho = Math.min(Math.max(rect.width, opciones.anchoMin ?? 0), anchoPantalla - margen * 2)
  menu.style.width = `${ancho}px`
  menu.style.left = `${Math.min(Math.max(margen, rect.left), anchoPantalla - margen - ancho)}px`
  menu.dataset.lado = haciaArriba ? 'arriba' : 'abajo'
}

export type SelectOption = {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: SelectProps) {
  const listboxId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const selected = options.find((o) => o.value === value)

  function openMenu() {
    if (disabled) return
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
  }

  function selectOption(next: string) {
    onChange(next)
    closeMenu()
    triggerRef.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open) return

    const menu = menuRef.current
    const trigger = triggerRef.current
    if (!menu || !trigger) return

    function syncPosition() {
      const currentMenu = menuRef.current
      const currentTrigger = triggerRef.current
      if (!currentMenu || !currentTrigger) return
      posicionarMenu(currentMenu, currentTrigger.getBoundingClientRect())
    }

    function trapWheel(e: WheelEvent) {
      const currentMenu = menuRef.current
      if (!currentMenu) return
      e.stopPropagation()
      const { scrollTop, scrollHeight, clientHeight } = currentMenu
      const delta = e.deltaY
      const atTop = scrollTop <= 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1
      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        e.preventDefault()
      }
    }

    function trapTouchMove(e: TouchEvent) {
      e.stopPropagation()
    }

    syncPosition()

    let rafId = 0
    function loop() {
      syncPosition()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    menu.addEventListener('wheel', trapWheel, { passive: false })
    menu.addEventListener('touchmove', trapTouchMove, { passive: true })
    window.addEventListener('resize', syncPosition)

    return () => {
      cancelAnimationFrame(rafId)
      menu.removeEventListener('wheel', trapWheel)
      menu.removeEventListener('touchmove', trapTouchMove)
      window.removeEventListener('resize', syncPosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      closeMenu()
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={[
          'select-field flex min-w-0 flex-1 items-center justify-between gap-2 text-left',
          open ? 'border-brand ring-brand/20 ring-2' : '',
          disabled ? 'cursor-not-allowed opacity-50' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={['min-w-0 truncate', selected ? 'text-text-primary' : 'text-text-muted'].join(
            ' '
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={[
            'text-text-secondary shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="scroll-touch border-bg-border bg-bg-surface shadow-pop fixed z-[250] max-h-64 overflow-y-auto overscroll-contain rounded-[14px] border p-1"
          >
            {options.length === 0 ? (
              <p className="text-text-muted px-3 py-2 text-sm">Sin opciones</p>
            ) : (
              options.map((option) => {
                const activa = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={activa}
                    onClick={() => selectOption(option.value)}
                    className={[
                      'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                      activa
                        ? 'bg-brand-soft text-brand'
                        : 'text-text-primary hover:bg-bg-elevated',
                    ].join(' ')}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {activa && <Check size={14} className="shrink-0" aria-hidden />}
                  </button>
                )
              })
            )}
          </div>,
          document.body
        )}
    </>
  )
}
