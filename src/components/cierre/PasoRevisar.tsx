'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, PartyPopper } from 'lucide-react'
import { NumeroAnimado } from '@/components/ui/NumeroAnimado'
import { etiquetaCuadre } from '@/components/cierre/caja/etiquetaCuadre'
import type { CierreDiaApi } from '@/hooks/useCierreDia'
import { masasUsadas } from '@/lib/cierre/estado'
import { pasoDeError, type IdPaso } from '@/lib/cierre/pasos'

function Dato({
  label,
  valor,
  pesos,
  tono,
}: {
  label: string
  valor: number
  pesos?: boolean
  tono?: string
}) {
  return (
    <div className="card p-4">
      <p className="text-text-secondary text-xs font-bold">{label}</p>
      <NumeroAnimado
        valor={valor}
        formato={pesos ? 'pesos' : 'numero'}
        className={`font-display mt-1 block text-2xl font-extrabold ${tono ?? 'text-text-primary'}`}
      />
    </div>
  )
}

/** Último paso: lo que falta y el resumen antes de finalizar */
export function PasoRevisar({
  cierre,
  errores,
  onIrA,
}: {
  cierre: CierreDiaApi
  errores: string[]
  onIrA: (paso: IdPaso) => void
}) {
  const { estado, cuadre, esAdmin, esCorreccion, vasosVendidos, bebidasVendidas } = cierre
  const comida =
    estado.ventasVariantes.reduce((s, v) => s + (v.cantidad || 0), 0) +
    estado.ventasComida.reduce((s, v) => s + (v.cantidad || 0), 0)
  const badge = etiquetaCuadre(estado.dineroFinal, cuadre.diferencia)

  return (
    <div className="flex flex-col gap-5">
      {errores.length > 0 ? (
        <section className="border-brand/30 bg-brand-soft/50 rounded-[var(--radius-lg)] border p-4 sm:p-5">
          <p className="text-brand-strong flex items-center gap-2 font-extrabold">
            <AlertTriangle size={18} />
            Antes de cerrar falta:
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {errores.map((e, i) => (
              <motion.li
                key={e}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-bg-surface flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-2.5"
              >
                <span className="text-text-primary text-sm font-semibold">{e}</span>
                <button
                  type="button"
                  onClick={() => onIrA(pasoDeError(e))}
                  className="focus-ring text-brand-strong flex shrink-0 items-center gap-1 text-sm font-extrabold"
                >
                  Ir <ArrowRight size={14} />
                </button>
              </motion.li>
            ))}
          </ul>
        </section>
      ) : (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-ok-soft text-ok flex items-center gap-3 rounded-[var(--radius-lg)] p-4 font-extrabold sm:p-5"
        >
          <PartyPopper size={22} />
          {esCorreccion
            ? 'Todo en orden para guardar la corrección.'
            : '¡Todo listo! Ya puedes finalizar el cierre.'}
        </motion.section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Dato label="Vasos vendidos" valor={vasosVendidos} />
        {estado.bebidas.length > 0 && <Dato label="Bebidas vendidas" valor={bebidasVendidas} />}
        <Dato label="Comida vendida" valor={comida} />
        {estado.masas.length > 0 && (
          <Dato
            label="Unidades de pizza usadas"
            valor={estado.masas.reduce((s, m) => s + masasUsadas(m), 0)}
            tono="text-warn"
          />
        )}
        {esAdmin && (
          <Dato label="Total vendido" valor={cuadre.totalVentas} pesos tono="text-brand-strong" />
        )}
        <Dato
          label="Gastos, transferencias y domicilios"
          valor={cuadre.totalGastos + cuadre.totalTransferencias + cuadre.totalDomicilios}
          pesos
        />
        <Dato label="Debe haber en caja" valor={cuadre.efectivoEsperado} pesos />
        <Dato label="Dinero contado" valor={estado.dineroFinal} pesos />
      </div>

      <div
        className={`rounded-[var(--radius-lg)] px-5 py-4 text-center text-lg font-extrabold ${badge.clase}`}
      >
        {badge.texto}
      </div>

      {!esAdmin && !esCorreccion && (
        <p className="text-text-secondary text-center text-sm">
          Al finalizar ya no podrás editar este día. Si algo queda mal, el administrador puede
          corregirlo.
        </p>
      )}
    </div>
  )
}
