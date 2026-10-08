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
  onClose,
  onChange,
}: NovedadesDrawerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Novedades · ${titulo}`}
      description="Vasos que se gastaron pero no se vendieron. Se descuentan de los vendidos."
    >
      <NovedadesVaso
        novedades={novedades}
        motivos={motivos}
        disabled={disabled}
        onChange={onChange}
      />
    </Modal>
  )
}
