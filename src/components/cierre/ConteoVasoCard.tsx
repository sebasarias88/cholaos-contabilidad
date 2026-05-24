'use client'

import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { NovedadesVaso } from '@/components/cierre/NovedadesVaso'
import {
  totalNovedades,
  vasosGastados,
  vendidosReales,
} from '@/lib/ventas-desde-vasos'
import { formatTalla } from '@/lib/utils'
import type { MotivoNovedad, NovedadVasoInput, TallaVaso } from '@/types'

export type ConteoVasoValor = {
  cantidad_inicio: number
  /** null = sin registrar (en petición va como 0) */
  cantidad_nuevos: number | null
  /** null = sin registrar; sin final no hay vasos gastados */
  cantidad_final: number | null
  novedades: NovedadVasoInput[]
}

interface ConteoVasoCardProps {
  talla: Pick<TallaVaso, 'id' | 'onzas' | 'descripcion' | 'tipo'>
  valor: ConteoVasoValor
  motivos: MotivoNovedad[]
  disabled?: boolean
  compact?: boolean
  onChange: <K extends keyof ConteoVasoValor>(
    campo: K,
    valor: ConteoVasoValor[K]
  ) => void
}

export function ConteoVasoCard({
  talla,
  valor,
  motivos,
  disabled = false,
  compact = false,
  onChange,
}: ConteoVasoCardProps) {
  const gastados = vasosGastados(valor)
  const novedadesTotal = totalNovedades(valor)
  const vendidos = vendidosReales(valor)

  const campos = [
    {
      label: 'Inicio',
      campo: 'cantidad_inicio' as const,
      val: valor.cantidad_inicio,
      readonly: true,
      editable: false,
    },
    {
      label: '+ Nuevos',
      campo: 'cantidad_nuevos' as const,
      val: valor.cantidad_nuevos,
      readonly: false,
      editable: true,
    },
    {
      label: 'Final',
      campo: 'cantidad_final' as const,
      val: valor.cantidad_final,
      readonly: false,
      editable: true,
    },
  ]

  function displayValue(n: number | null, editable: boolean) {
    if (editable && n === null) return ''
    return n ?? 0
  }

  function parseCantidadEditable(raw: string): number | null {
    const trimmed = raw.trim()
    if (trimmed === '') return null
    return Math.max(0, Number(trimmed) || 0)
  }

  return (
    <motion.div
      layout
      className={['card', compact ? 'space-y-2.5 p-3' : 'space-y-3 p-4'].join(' ')}
    >
      <motion.div layout className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Package size={16} className="shrink-0 text-accent-cyan" aria-hidden />
          {talla.descripcion ? (
            <>
              <span className="font-medium text-text-primary">{talla.descripcion}</span>
              <span className="font-medium text-text-primary">— {formatTalla(talla)}</span>
            </>
          ) : (
            <span className="font-medium text-text-primary">{formatTalla(talla)}</span>
          )}
        </div>
        {vendidos > 0 && (
          <span className="shrink-0 rounded-full bg-accent-cyan-dim px-2 py-0.5 text-xs font-medium text-accent-cyan tabular-nums">
            {vendidos} vendidos
          </span>
        )}
      </motion.div>

      <div className={['grid grid-cols-3', compact ? 'gap-2' : 'gap-3'].join(' ')}>
        {campos.map(({ label, campo, val, readonly, editable }) => (
          <div key={campo} className="space-y-1">
            <label className="text-xs text-text-muted">{label}</label>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={displayValue(val, editable)}
              placeholder={editable ? '0' : undefined}
              readOnly={readonly}
              disabled={disabled}
              onChange={(e) => {
                if (!readonly && !disabled) {
                  onChange(
                    campo,
                    editable ? parseCantidadEditable(e.target.value) : val
                  )
                }
              }}
              className={[
                compact
                  ? 'select-field w-full text-center text-base font-medium tabular-nums'
                  : 'select-field w-full text-center text-lg font-medium tabular-nums',
                readonly ? 'cursor-default opacity-60' : '',
              ].join(' ')}
            />
          </div>
        ))}
      </div>

      {(gastados > 0 || novedadesTotal > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {gastados > 0 && (
            <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-secondary tabular-nums">
              {gastados} gastados
            </span>
          )}
          {novedadesTotal > 0 && (
            <span className="rounded-full bg-accent-amber/15 px-2 py-0.5 text-xs font-medium text-accent-amber tabular-nums">
              −{novedadesTotal} novedades
            </span>
          )}
          {gastados > 0 && (
            <span className="rounded-full bg-accent-cyan-dim px-2 py-0.5 text-xs font-medium text-accent-cyan tabular-nums">
              = {vendidos} vendidos
            </span>
          )}
        </div>
      )}

      <div className="rounded-[var(--radius-md)] border border-accent-amber/15 p-2.5">
        <NovedadesVaso
          novedades={valor.novedades}
          motivos={motivos}
          disabled={disabled}
          onChange={(nuevasNovedades) => onChange('novedades', nuevasNovedades)}
        />
      </div>
    </motion.div>
  )
}
