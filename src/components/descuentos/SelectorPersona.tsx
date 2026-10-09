'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, UserPlus } from 'lucide-react'
import { claveNombre, coincideNombre, etiquetaTipoPersona, TIPOS_PERSONA } from '@/lib/descuentos'
import { toastError } from '@/lib/toast'
import type { PersonaDescuento, TipoPersonaDescuento } from '@/types'

export type PersonaElegida = { id: string; nombre: string }

interface SelectorPersonaProps {
  value: PersonaElegida | null
  onChange: (persona: PersonaElegida) => void
  personas: PersonaDescuento[]
  onCrear: (nombre: string, tipo: TipoPersonaDescuento) => Promise<PersonaDescuento>
  className?: string
  'aria-label'?: string
}

/**
 * Buscador de personas para un descuento. Si el nombre no existe, se puede
 * crear ahí mismo eligiendo si es empleado, familia o cliente.
 */
export function SelectorPersona({
  value,
  onChange,
  personas,
  onCrear,
  className = '',
  'aria-label': ariaLabel = 'Persona',
}: SelectorPersonaProps) {
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(0)
  const [creando, setCreando] = useState(false)

  const busqueda = texto.trim()
  const filtradas = personas
    .filter((p) => p.activo && (!busqueda || coincideNombre(p.nombre, busqueda)))
    .slice(0, 30)
  const existeExacta = personas.some((p) => claveNombre(p.nombre) === claveNombre(busqueda))
  const puedeCrear = busqueda.length > 0 && !existeExacta

  function abrir() {
    setTexto('')
    setActivo(0)
    setOpen(true)
  }

  function cerrar() {
    setOpen(false)
    setTexto('')
  }

  function elegir(persona: PersonaElegida) {
    onChange({ id: persona.id, nombre: persona.nombre })
    cerrar()
    inputRef.current?.blur()
  }

  async function crear(tipo: TipoPersonaDescuento) {
    if (!puedeCrear || creando) return
    setCreando(true)
    try {
      const nueva = await onCrear(busqueda, tipo)
      elegir(nueva)
    } catch (e) {
      toastError((e as Error).message)
    } finally {
      setCreando(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      abrir()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((i) => Math.min(i + 1, Math.max(filtradas.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const persona = filtradas[activo]
      if (persona) elegir(persona)
      else if (puedeCrear) void crear('empleado')
    } else if (e.key === 'Escape') {
      cerrar()
    }
  }

  // Posición del menú pegada al campo (también al hacer scroll)
  useLayoutEffect(() => {
    if (!open) return
    let raf = 0
    function sync() {
      const menu = menuRef.current
      const input = inputRef.current
      if (menu && input) {
        const rect = input.getBoundingClientRect()
        menu.style.top = `${rect.bottom + 4}px`
        menu.style.left = `${rect.left}px`
        menu.style.width = `${Math.max(rect.width, 240)}px`
      }
      raf = requestAnimationFrame(sync)
    }
    sync()
    return () => cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (inputRef.current?.contains(target) || menuRef.current?.contains(target)) return
      cerrar()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div className={`relative min-w-0 ${className}`}>
      <input
        ref={inputRef}
        value={open ? texto : (value?.nombre ?? '')}
        onChange={(e) => {
          setTexto(e.target.value)
          setActivo(0)
          if (!open) setOpen(true)
        }}
        onFocus={abrir}
        onKeyDown={onKeyDown}
        placeholder={open && value ? value.nombre : '¿A quién?'}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        className={`input placeholder:text-text-secondary w-full pr-9 ${
          value && !open ? 'text-text-primary font-bold' : ''
        }`}
      />
      <ChevronDown
        size={16}
        aria-hidden
        className={`text-text-secondary pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transition-transform ${
          open ? 'rotate-180' : ''
        }`}
      />

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="scroll-touch border-bg-border bg-bg-surface shadow-pop fixed z-[250] max-h-72 overflow-y-auto overscroll-contain rounded-[14px] border p-1"
          >
            {filtradas.length === 0 && !puedeCrear && (
              <p className="text-text-muted px-3 py-2 text-sm">
                Escribe el nombre para buscar o crear
              </p>
            )}
            {filtradas.map((p, i) => {
              const elegida = value?.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={elegida}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => elegir(p)}
                  className={`flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left text-sm transition-colors ${
                    i === activo ? 'bg-bg-elevated' : ''
                  } ${elegida ? 'text-brand font-bold' : 'text-text-primary'}`}
                >
                  <span className="min-w-0 truncate">{p.nombre}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-text-muted text-xs">{etiquetaTipoPersona(p.tipo)}</span>
                    {elegida && <Check size={14} aria-hidden />}
                  </span>
                </button>
              )
            })}
            {puedeCrear && (
              <div className="border-bg-border mt-1 border-t px-2 pt-2 pb-1">
                <p className="text-text-secondary flex items-center gap-1.5 px-1 text-xs font-bold">
                  <UserPlus size={14} aria-hidden />
                  Crear «{busqueda}» como:
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {TIPOS_PERSONA.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={creando}
                      onClick={() => void crear(t.id)}
                      className="bg-brand-soft text-brand hover:bg-brand/20 rounded-[10px] px-2 py-2 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
