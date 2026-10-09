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
        <>
          <Input
            label="Unidad"
            placeholder="caja, kg, unidad..."
            value={form.unidad}
            onChange={(e) => onChange({ ...form, unidad: e.target.value })}
            required
          />
          <Input
            label="Unidades por caja (opcional)"
            name="unidades_por_caja"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Ej. 24"
            hint="Si se llena, en el cierre se cuenta en cajas y unidades (ej. barquillos)."
            value={form.unidades_por_caja}
            onChange={(e) => onChange({ ...form, unidades_por_caja: e.target.value })}
          />
        </>
      )}
      {esMasa && (
        <label className="border-bg-border bg-bg-elevated/40 flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border px-3 py-3">
          <input
            type="checkbox"
            checked={form.lleva_masas}
            onChange={(e) => onChange({ ...form, lleva_masas: e.target.checked })}
            className="border-bg-border mt-0.5 h-4 w-4 rounded accent-[var(--brand)]"
          />
          <span className="text-text-secondary text-sm leading-snug">
            <span className="text-text-primary font-bold">Lleva número de masas</span> — además de
            con cuántas empezó y terminó, se anota cuántas masas hay.
          </span>
        </label>
      )}
      <p className="border-bg-border bg-bg-elevated/50 text-text-secondary rounded-[var(--radius-md)] border px-3 py-2 text-xs leading-relaxed">
        {esMasa
          ? 'Las masas de pizza no generan venta. En el cierre se anota con cuántas empezó y con cuántas terminó el día.'
          : 'Los insumos no generan venta — solo se lleva conteo de inventario.'}
      </p>
    </motion.div>
  )
}
