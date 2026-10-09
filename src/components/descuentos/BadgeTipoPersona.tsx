import { etiquetaTipoPersona } from '@/lib/descuentos'
import type { TipoPersonaDescuento } from '@/types'

const COLOR_TIPO: Record<TipoPersonaDescuento, string> = {
  empleado: 'bg-brand-soft text-brand',
  familia: 'bg-ok-soft text-ok',
  cliente: 'bg-bg-elevated text-text-secondary',
}

export function BadgeTipoPersona({ tipo }: { tipo: TipoPersonaDescuento }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${COLOR_TIPO[tipo]}`}
    >
      {etiquetaTipoPersona(tipo)}
    </span>
  )
}
