'use client'

import { useState, type KeyboardEventHandler } from 'react'
import { formatPesosInput, parsePesosInput } from '@/lib/utils'

interface InputPesoProps {
  id?: string
  value: number
  onChange: (valor: number) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  title?: string
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
}

export function InputPeso({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  title,
  onKeyDown,
}: InputPesoProps) {
  const [display, setDisplay] = useState(() => formatPesosInput(value))
  const [focused, setFocused] = useState(false)

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      title={title}
      placeholder={placeholder}
      // Si el valor cambió desde afuera (ej. se limpió al agregar), se muestra el nuevo
      value={focused && parsePesosInput(display) === value ? display : formatPesosInput(value)}
      onKeyDown={onKeyDown}
      onFocus={() => {
        setDisplay(formatPesosInput(value))
        setFocused(true)
      }}
      onBlur={() => {
        setFocused(false)
        setDisplay(formatPesosInput(value))
      }}
      onChange={(e) => {
        const n = parsePesosInput(e.target.value)
        setDisplay(e.target.value === '' ? '' : formatPesosInput(n))
        onChange(n)
      }}
      className={className}
    />
  )
}
