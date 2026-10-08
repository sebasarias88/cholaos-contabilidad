'use client'

import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { etiquetaTipoVaso, formatTalla } from '@/lib/utils'
import type { TallaVaso, TipoVaso } from '@/types'
import type { ProductoFormState } from '@/lib/productos/formulario'

const fieldsMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

export function CamposVaso({
  form,
  tallas,
  onChange,
}: {
  form: ProductoFormState
  tallas: TallaVaso[]
  onChange: (form: ProductoFormState) => void
}) {
  const creandoTallaNueva = form.tipo === 'vaso' && !form.talla_id

  const opcionesTalla = [
    { value: '', label: '+ Crear vaso físico nuevo…' },
    ...tallas
      .filter((t) => t.activo)
      .map((t) => ({
        value: t.id,
        label: t.descripcion?.trim() ? `${t.descripcion} · ${formatTalla(t)}` : formatTalla(t),
      })),
  ]

  function setTallaId(tallaId: string) {
    if (!tallaId) {
      onChange({
        ...form,
        talla_id: '',
        onzas: form.onzas || '',
      })
      return
    }
    const talla = tallas.find((t) => t.id === tallaId)
    onChange({
      ...form,
      talla_id: tallaId,
      onzas: talla ? String(talla.onzas) : form.onzas,
      tipo_vaso: talla?.tipo ?? form.tipo_vaso,
      talla_descripcion: talla?.descripcion ?? form.talla_descripcion,
    })
  }

  return (
    <motion.div key="vaso-fields" {...fieldsMotion} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-text-secondary text-sm font-medium">
          Vaso físico (conteo compartido)
        </label>
        <Select
          value={form.talla_id}
          onChange={setTallaId}
          options={opcionesTalla}
          placeholder="Seleccionar vaso…"
          aria-label="Vaso físico"
        />
        <p className="text-text-muted text-xs leading-relaxed">
          Varios productos pueden usar el mismo vaso (ej. 14 oz ancho → Cholao, Milo, Malteadas). El
          conteo del cierre es por vaso; el precio va por producto.
        </p>
      </div>

      {creandoTallaNueva ? (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Onzas"
            type="number"
            min={1}
            step={1}
            placeholder="ej: 14"
            value={form.onzas}
            onChange={(e) => onChange({ ...form, onzas: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium">Forma</label>
            <Select
              value={form.tipo_vaso}
              onChange={(v) =>
                onChange({
                  ...form,
                  tipo_vaso: v as TipoVaso,
                })
              }
              options={[
                { value: 'normal', label: etiquetaTipoVaso('normal') },
                { value: 'ancho', label: etiquetaTipoVaso('ancho') },
                {
                  value: 'angosto',
                  label: etiquetaTipoVaso('angosto'),
                },
              ]}
              aria-label="Forma del vaso"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Nombre del vaso (opcional)"
              placeholder="ej: 14 oz ancho"
              value={form.talla_descripcion}
              onChange={(e) =>
                onChange({
                  ...form,
                  talla_descripcion: e.target.value,
                })
              }
            />
          </div>
        </div>
      ) : (
        <p className="border-bg-border bg-bg-elevated/50 text-text-secondary rounded-[var(--radius-md)] border px-3 py-2 text-xs">
          Onzas:{' '}
          <span className="text-text-primary font-medium tabular-nums">{form.onzas || '—'} oz</span>
          {form.tipo_vaso !== 'normal' && <> · {etiquetaTipoVaso(form.tipo_vaso)}</>}
        </p>
      )}

      <Input
        label="Precio de este producto (COP)"
        type="number"
        min={0}
        step={1}
        placeholder="0"
        value={form.precio}
        onChange={(e) => onChange({ ...form, precio: e.target.value })}
        required
      />
    </motion.div>
  )
}
