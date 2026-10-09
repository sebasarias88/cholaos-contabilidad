'use client'

import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import type { ProductoFormState } from '@/lib/productos/formulario'

const fieldsMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

export function CamposInsumo({
  form,
  onChange,
}: {
  form: ProductoFormState
  onChange: (form: ProductoFormState) => void
}) {
  const esMasa = form.tipo === 'masa'
  return (
    <motion.div key={`${form.tipo}-fields`} {...fieldsMotion} className="space-y-3">
      {!esMasa && (
        <Input
          label="Unidad"
          placeholder="caja, kg, unidad..."
          value={form.unidad}
          onChange={(e) => onChange({ ...form, unidad: e.target.value })}
          required
        />
      )}
      <p className="border-bg-border bg-bg-elevated/50 text-text-secondary rounded-[var(--radius-md)] border px-3 py-2 text-xs leading-relaxed">
        {esMasa
          ? 'Las masas de pizza no generan venta. En el cierre se anota con cuántas empezó y con cuántas terminó el día.'
          : 'Los insumos no generan venta — solo se lleva conteo de inventario.'}
      </p>
    </motion.div>
  )
}
