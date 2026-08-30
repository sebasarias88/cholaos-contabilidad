'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

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
      const rect = currentTrigger.getBoundingClientRect()
      currentMenu.style.top = `${rect.bottom + 4}px`
      currentMenu.style.left = `${rect.left}px`
      currentMenu.style.width = `${rect.width}px`
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
          open ? 'border-accent-cyan ring-2 ring-accent-cyan/20' : '',
          disabled ? 'cursor-not-allowed opacity-50' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={[
            'min-w-0 truncate capitalize',
            selected ? 'text-text-primary' : 'text-text-muted',
          ].join(' ')}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={[
            'shrink-0 text-text-secondary transition-transform duration-200',
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
            data-lenis-prevent
            className="scroll-touch fixed z-[250] max-h-56 overflow-y-auto overscroll-contain rounded-[var(--radius-md)] border border-bg-border bg-bg-surface py-1 shadow-xl"
          >
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-text-muted">
                Sin opciones
              </p>
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
                      'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm capitalize transition-colors',
                      activa
                        ? 'bg-accent-cyan-dim text-accent-cyan'
                        : 'text-text-primary hover:bg-bg-elevated',
                    ].join(' ')}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {activa && (
                      <Check size={14} className="shrink-0" aria-hidden />
                    )}
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
