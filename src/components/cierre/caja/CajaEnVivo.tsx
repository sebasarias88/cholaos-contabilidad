'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { NumeroAnimado } from '@/components/ui/NumeroAnimado'
import { InputPeso } from '@/components/ui/InputPeso'
import { etiquetaCuadre } from '@/components/cierre/caja/etiquetaCuadre'
import type { CierreDiaApi } from '@/hooks/useCierreDia'

function Fila({
  label,
  valor,
  signo,
  resaltar,
}: {
  label: string
  valor: number
  signo?: '+' | '−'
  resaltar?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-cocoa-muted">{label}</span>
      <span className={`font-bold tabular-nums ${resaltar ? 'text-[#FFB27A]' : ''}`}>
        {signo && `${signo} `}
        <NumeroAnimado valor={valor} formato="pesos" />
      </span>
    </div>
  )
}

/** Panel lateral oscuro con el cuadre en tiempo real y las acciones del cierre */
export function CajaEnVivo({
  cierre,
  textoSiguiente,
  onSiguiente,
  onFinalizar,
  esRevisar,
}: {
  cierre: CierreDiaApi
  textoSiguiente: string | null
  onSiguiente: () => void
  onFinalizar: () => void
  esRevisar: boolean
}) {
  const { estado, cuadre, esAdmin, bloqueado, esCorreccion, guardando, hayCambios, actualizar } =
    cierre
  const badge = etiquetaCuadre(estado.dineroFinal, cuadre.diferencia)

  return (
    <aside className="bg-cocoa text-cocoa-text shadow-pop sticky top-6 flex w-full flex-col gap-5 rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Caja en vivo</h2>
        <AnimatePresence>
          {hayCambios && !bloqueado && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FFD48A]"
            >
              <span className="bg-warn-solid h-2 w-2 animate-pulse rounded-full" />
              Sin guardar
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2.5">
        {estado.baseNueva !== null && estado.baseNueva !== estado.dineroBase ? (
          <>
            <Fila label="Base de anoche" valor={estado.dineroBase} />
            <Fila label="Base nueva" valor={estado.baseNueva} resaltar />
          </>
        ) : (
          <Fila label="Base de inicio" valor={estado.dineroBase} />
        )}
        {esAdmin && <Fila label="Vendido" valor={cuadre.totalVentas} signo="+" resaltar />}
        <Fila label="Transferencias" valor={cuadre.totalTransferencias} signo="−" />
        <Fila label="Gastos" valor={cuadre.totalGastos} signo="−" />
        <Fila label="Domicilios" valor={cuadre.totalDomicilios} signo="−" />
        <div className="bg-cocoa-3 my-1 h-px" />
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-bold">Debe haber en caja</span>
          <NumeroAnimado
            valor={cuadre.efectivoEsperado}
            formato="pesos"
            className="font-display text-2xl font-extrabold"
          />
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-cocoa-muted text-xs font-bold">Dinero contado</span>
        <InputPeso
          value={estado.dineroFinal}
          onChange={(n) => actualizar({ dineroFinal: n })}
          disabled={bloqueado}
          placeholder="$0"
          className="border-cocoa-3 bg-cocoa-2 focus:border-warn-solid focus:ring-warn-solid/20 h-13 w-full rounded-[14px] border px-4 text-xl font-extrabold text-white tabular-nums outline-none placeholder:text-white/30 focus:ring-4 disabled:opacity-70"
        />
      </label>

      <motion.div
        key={badge.texto}
        initial={{ scale: 0.95, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-[14px] px-4 py-3 text-center text-[15px] font-extrabold ${badge.claseOscura}`}
      >
        {badge.texto}
      </motion.div>

      {!bloqueado && (
        <div className="flex flex-col gap-2.5">
          {esRevisar || esCorreccion ? (
            <Button
              size="lg"
              onClick={onFinalizar}
              loading={guardando === 'finalizar'}
              disabled={guardando !== null}
            >
              {esCorreccion ? 'Guardar corrección' : 'Finalizar cierre'}
            </Button>
          ) : (
            textoSiguiente && (
              <Button size="lg" onClick={onSiguiente}>
                Siguiente: {textoSiguiente}
                <ArrowRight size={18} />
              </Button>
            )
          )}
          {!esCorreccion && (
            <button
              type="button"
              onClick={() => void cierre.guardar(false)}
              disabled={guardando !== null}
              className="focus-ring border-cocoa-3 hover:bg-cocoa-2 flex min-h-11 items-center justify-center gap-2 rounded-[12px] border text-sm font-bold transition-colors disabled:opacity-50"
            >
              {guardando === 'avance' ? (
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                />
              ) : (
                <Save size={16} />
              )}
              Guardar avance
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
