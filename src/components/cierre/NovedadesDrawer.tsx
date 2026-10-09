'use client'

import { NovedadesVaso } from '@/components/cierre/NovedadesVaso'
import { Modal } from '@/components/ui/Modal'
import type { MotivoNovedad, NovedadVasoInput } from '@/types'

interface NovedadesDrawerProps {
  open: boolean
  titulo: string
  novedades: NovedadVasoInput[]
  motivos: MotivoNovedad[]
  disabled?: boolean
  /** Cómo se llaman las unidades en el texto ("vasos", "unidades") */
  unidad?: string
  onClose: () => void
  onChange: (novedades: NovedadVasoInput[]) => void
}

/** Vasos que salieron sin venderse (dañados, regalados…) */
export function NovedadesDrawer({
  open,
  titulo,
  novedades,
  motivos,
  disabled = false,
  unidad = 'vasos',
  onClose,
  onChange,
}: NovedadesDrawerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Novedades · ${titulo}`}
      description={
        unidad === 'vasos'
          ? 'Vasos que se gastaron pero no se vendieron. Se descuentan de los vendidos.'
          : 'Unidades que salieron pero no se vendieron (dañadas, regaladas…). Se descuentan de las vendidas.'
      }
    >
      <NovedadesVaso
        etiqueta={unidad === 'vasos' ? 'Vasos no vendidos' : 'Unidades no vendidas'}
        novedades={novedades}
        motivos={motivos}
        disabled={disabled}
        onChange={onChange}
      />
    </Modal>
  )
}
