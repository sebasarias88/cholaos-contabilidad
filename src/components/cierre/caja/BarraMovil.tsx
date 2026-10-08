'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Save } from 'lucide-react'
import { NumeroAnimado } from '@/components/ui/NumeroAnimado'
import { etiquetaCuadre } from '@/components/cierre/caja/etiquetaCuadre'
import type { CierreDiaApi } from '@/hooks/useCierreDia'

/** Barra inferior en celular y tablet: cuánto debe haber + avanzar */
export function BarraMovil({
  cierre,
  textoBoton,
  onBoton,
}: {
  cierre: CierreDiaApi
  textoBoton: string
  onBoton: () => void
}) {
  const { estado, cuadre, bloqueado, esCorreccion, guardando } = cierre
  const badge = etiquetaCuadre(estado.dineroFinal, cuadre.diferencia)

  return (
    <>
      <div className="h-28 lg:hidden" aria-hidden />
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-cocoa text-cocoa-text fixed inset-x-0 bottom-0 z-30 rounded-t-[24px] px-4 pt-3 pb-[calc(0.9rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_rgb(42_26_18/0.2)] md:left-[84px] lg:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex h-5 items-center">
              {estado.dineroFinal > 0 ? (
                <motion.span
                  key={badge.texto}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${badge.claseOscura}`}
                >
                  {badge.texto}
                </motion.span>
              ) : (
                <span className="text-cocoa-muted truncate text-xs font-semibold">
                  Debe haber en caja
                </span>
              )}
            </div>
            <NumeroAnimado
              valor={cuadre.efectivoEsperado}
              formato="pesos"
              className="font-display block text-xl font-extrabold"
            />
          </div>
          {!bloqueado && !esCorreccion && (
            <button
              type="button"
              aria-label="Guardar avance"
              onClick={() => void cierre.guardar(false)}
              disabled={guardando !== null}
              className="focus-ring border-cocoa-3 flex h-12 w-12 items-center justify-center rounded-[14px] border disabled:opacity-50"
            >
              {guardando === 'avance' ? (
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                />
              ) : (
                <Save size={18} />
              )}
            </button>
          )}
          {!bloqueado && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onBoton}
              disabled={guardando !== null}
              className="focus-ring bg-brand shadow-brand flex min-h-12 items-center gap-2 rounded-[14px] px-5 font-extrabold text-white disabled:opacity-60"
            >
              {textoBoton}
              <ArrowRight size={18} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </>
  )
}
