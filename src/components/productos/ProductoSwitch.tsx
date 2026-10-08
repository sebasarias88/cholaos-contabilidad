'use client'

import { motion } from 'framer-motion'

interface ProductoSwitchProps {
  active: boolean
  onChange: (active: boolean) => void
  disabled?: boolean
  'aria-label'?: string
}

export function ProductoSwitch({
  active,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: ProductoSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={[
        'focus-ring relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        active ? 'bg-ok-solid' : 'bg-bg-border',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 left-0.5 block h-6 w-6 rounded-full bg-white shadow-md"
        animate={{ x: active ? 20 : 0 }}
      />
    </button>
  )
}
