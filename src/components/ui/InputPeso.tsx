'use client'

import { useEffect, useState } from 'react'
import { formatPesosInput, parsePesosInput } from '@/lib/utils'

interface InputPesoProps {
  id?: string
  value: number
  onChange: (valor: number) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  title?: string
}

export function InputPeso({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  title,
}: InputPesoProps) {
  const [display, setDisplay] = useState(() => formatPesosInput(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDisplay(formatPesosInput(value))
  }, [value, focused])

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      title={title}
      placeholder={placeholder}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        const n = parsePesosInput(display)
        onChange(n)
        setDisplay(formatPesosInput(n))
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
