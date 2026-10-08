'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { calcularCuadre } from '@/hooks/useCuadre'
import { formatFecha, formatPesos } from '@/lib/utils'

type Cuadre = ReturnType<typeof calcularCuadre>

interface ConfirmarCierreModalProps {
  open: boolean
  guardando: boolean
  esAdmin: boolean
  esCorreccion: boolean
  fecha: string
  vasosVendidos: number
  itemsComida: number
  cuadre: Cuadre
  dineroBase: number
  dineroFinal: number
  onCancel: () => void
  onConfirm: () => void
}

function Fila({
  label,
  valor,
  fuerte,
  className,
}: {
  label: string
  valor: string
  fuerte?: boolean
  className?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span
        className={[
          'tabular-nums',
          fuerte ? 'font-semibold text-text-primary' : 'text-text-primary',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {valor}
      </span>
    </div>
  )
}

/** Resumen final antes de guardar el cierre (para el empleado es definitivo) */
export function ConfirmarCierreModal({
  open,
  guardando,
  esAdmin,
  esCorreccion,
  fecha,
  vasosVendidos,
  itemsComida,
  cuadre,
  dineroBase,
  dineroFinal,
  onCancel,
  onConfirm,
}: ConfirmarCierreModalProps) {
  const { diferencia } = cuadre
  const textoDiferencia =
    diferencia === 0
      ? 'Cuadre exacto'
      : diferencia < 0
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : `Sobra ${formatPesos(diferencia)}`
  const colorDiferencia =
    diferencia === 0
      ? 'text-accent-green'
      : diferencia < 0
        ? 'text-accent-red'
        : 'text-amber-400'

  return (
    <Modal
      open={open}
      onClose={() => !guardando && onCancel()}
      title={esCorreccion ? 'Guardar corrección' : 'Confirmar cierre del día'}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {formatFecha(fecha)}. Revisa el resumen antes de guardar.
        </p>

        <div className="divide-y divide-bg-border rounded-[var(--radius-md)] border border-bg-border px-4 py-1">
          <Fila label="Vasos vendidos" valor={String(vasosVendidos)} />
          <Fila label="Comida vendida" valor={`${itemsComida} und.`} />
          {esAdmin && (
            <Fila
              label="Total vendido"
              valor={formatPesos(cuadre.totalVentas)}
              className="text-accent-cyan"
            />
          )}
          <Fila label="Base inicio" valor={formatPesos(dineroBase)} />
          <Fila label="Gastos" valor={formatPesos(cuadre.totalGastos)} />
          <Fila label="Transferencias" valor={formatPesos(cuadre.totalTransferencias)} />
          <Fila label="Domicilios" valor={formatPesos(cuadre.totalDomicilios)} />
          <Fila label="Esperado en caja" valor={formatPesos(cuadre.efectivoEsperado)} fuerte />
          <Fila label="Contado en caja" valor={formatPesos(dineroFinal)} fuerte />
          <Fila label="Resultado" valor={textoDiferencia} fuerte className={colorDiferencia} />
        </div>

        {!esAdmin && !esCorreccion && (
          <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-amber-500/10 p-3 text-xs text-amber-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
            Después de cerrar no podrás editar este día. Solo el administrador puede corregirlo.
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={guardando}
            className="w-full sm:w-auto"
          >
            Revisar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            loading={guardando}
            disabled={guardando}
            className="w-full sm:w-auto"
          >
            {esCorreccion ? 'Guardar corrección' : 'Cerrar día'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
