'use client'

import { Save, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { etiquetaCuadre } from '@/components/cierre/caja/etiquetaCuadre'
import type { CierreDiaApi } from '@/hooks/useCierreDia'
import { formatPesos } from '@/lib/utils'

/** Barra fija inferior: estado de caja + Guardar avance / Finalizar */
export function BarraCierre({
  cierre,
  onAbrirResumen,
  onFinalizar,
}: {
  cierre: CierreDiaApi
  onAbrirResumen: () => void
  onFinalizar: () => void
}) {
  const { estado, cuadre, bloqueado, esCorreccion, guardando, hayCambios } = cierre
  const badge = etiquetaCuadre(estado.dineroFinal, cuadre.diferencia)
  const nMovimientos =
    estado.gastos.length + estado.transferencias.length + estado.domicilios.length

  return (
    <>
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom,0px))] shrink-0" aria-hidden />
      <div className="border-bg-border bg-bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:left-60">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.clase}`}>
            {badge.texto}
          </span>

          <div className="hidden min-w-0 flex-1 items-center gap-4 text-xs sm:flex">
            <span>
              <span className="text-text-secondary">Esperado </span>
              <span className="text-text-primary font-semibold tabular-nums">
                {formatPesos(cuadre.efectivoEsperado)}
              </span>
            </span>
            <span>
              <span className="text-text-secondary">Contado </span>
              <span className="text-text-primary font-semibold tabular-nums">
                {formatPesos(estado.dineroFinal)}
              </span>
            </span>
            {hayCambios && !bloqueado && (
              <span className="text-amber-400">Cambios sin guardar</span>
            )}
          </div>

          <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="h-10 flex-1 gap-1.5 sm:flex-none"
              onClick={onAbrirResumen}
            >
              <Wallet size={16} aria-hidden />
              Caja
              {nMovimientos > 0 && (
                <span className="bg-bg-elevated text-text-secondary rounded-full px-1.5 text-[10px] font-semibold tabular-nums">
                  {nMovimientos}
                </span>
              )}
            </Button>

            {!bloqueado && !esCorreccion && (
              <Button
                type="button"
                variant="secondary"
                className="h-10 flex-1 gap-1.5 sm:flex-none"
                loading={guardando === 'avance'}
                disabled={guardando !== null}
                onClick={() => void cierre.guardar(false)}
              >
                <Save size={16} aria-hidden />
                Guardar avance
              </Button>
            )}

            {!bloqueado && (
              <Button
                type="button"
                className="h-10 flex-1 sm:min-w-[8.5rem] sm:flex-none"
                loading={guardando === 'finalizar'}
                disabled={guardando !== null}
                onClick={onFinalizar}
              >
                {esCorreccion ? 'Guardar corrección' : 'Finalizar cierre'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
