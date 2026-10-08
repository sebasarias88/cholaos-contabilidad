'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

/** Confirmación de una acción destructiva (eliminar, borrar datos…) */
export function ConfirmarModal({
  open,
  titulo,
  children,
  textoConfirmar = 'Eliminar',
  cargando = false,
  deshabilitado = false,
  onCancelar,
  onConfirmar,
}: {
  open: boolean
  titulo: string
  children: ReactNode
  textoConfirmar?: string
  cargando?: boolean
  deshabilitado?: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return (
    <Modal open={open} onClose={() => !cargando && onCancelar()} title={titulo}>
      <div className="text-text-secondary mb-6 text-sm">{children}</div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={cargando}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          className="flex-1"
          loading={cargando}
          disabled={cargando || deshabilitado}
          onClick={onConfirmar}
        >
          {textoConfirmar}
        </Button>
      </div>
    </Modal>
  )
}
