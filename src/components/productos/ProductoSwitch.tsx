'use client'

import { motion } from 'framer-motion'

interface ProductoSwitchProps {
  active: boolean
  onChange: (active: boolean) => void
  disabled?: boolean
}

export function ProductoSwitch({
  active,
  onChange,
  disabled = false,
}: ProductoSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        active ? 'bg-accent-cyan' : 'bg-bg-border',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-text-primary shadow-md"
        animate={{ x: active ? 20 : 0 }}
      />
    </button>
  )
}
