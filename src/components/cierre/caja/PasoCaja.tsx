'use client'

import { ArrowLeftRight, Bike, Receipt, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { InputPeso } from '@/components/ui/InputPeso'
import { NumeroAnimado } from '@/components/ui/NumeroAnimado'
import { ListaMovimientos } from '@/components/cierre/caja/ListaMovimientos'
import { NuevoMovimiento } from '@/components/cierre/caja/NuevoMovimiento'
import { BaseCaja } from '@/components/cierre/caja/BaseCaja'
import type { CierreDiaApi } from '@/hooks/useCierreDia'

function Bloque({
  icono,
  titulo,
  total,
  children,
  className = '',
}: {
  icono: ReactNode
  titulo: string
  total?: number
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card flex min-w-0 flex-col gap-3 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-text-primary flex items-center gap-2.5 text-base font-extrabold">
          <span className="bg-brand-soft text-brand flex h-9 w-9 items-center justify-center rounded-[10px]">
            {icono}
          </span>
          {titulo}
        </h3>
        {total !== undefined && total > 0 && (
          <NumeroAnimado
            valor={total}
            formato="pesos"
            className="text-text-primary font-extrabold"
          />
        )}
      </div>
      {children}
    </section>
  )
}

/** Paso Caja: gastos, transferencias, domicilios, dinero contado y notas */
export function PasoCaja({ cierre }: { cierre: CierreDiaApi }) {
  const { estado, cuadre, bloqueado, movimientos, actualizar } = cierre
  const medios = cierre.datos?.medios ?? []

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <Bloque icono={<Receipt size={18} />} titulo="Gastos del día" total={cuadre.totalGastos}>
        {!bloqueado && <NuevoMovimiento tipo="gasto" onAgregar={movimientos.agregarGasto} />}
        <ListaMovimientos
          items={estado.gastos.map((g) => ({ id: g.id, etiqueta: g.descripcion, monto: g.monto }))}
          bloqueado={bloqueado}
          edicion={{
            tipo: 'texto',
            placeholder: 'Ej. hielo, gas…',
            onChange: movimientos.editarGasto,
          }}
          onEliminar={movimientos.quitarGasto}
        />
      </Bloque>

      <Bloque
        icono={<ArrowLeftRight size={18} />}
        titulo="Transferencias"
        total={cuadre.totalTransferencias}
      >
        {!bloqueado && (
          <NuevoMovimiento
            tipo="transferencia"
            medios={medios}
            onAgregar={movimientos.agregarTransferencia}
          />
        )}
        <ListaMovimientos
          items={estado.transferencias.map((t) => ({
            id: t.id,
            etiqueta: t.descripcion,
            monto: t.monto,
            medioId: t.medio_id,
          }))}
          bloqueado={bloqueado}
          edicion={{ tipo: 'medio', medios, onChange: movimientos.editarTransferencia }}
          onEliminar={movimientos.quitarTransferencia}
        />
      </Bloque>

      <Bloque icono={<Bike size={18} />} titulo="Domicilios" total={cuadre.totalDomicilios}>
        {!bloqueado && (
          <NuevoMovimiento tipo="domicilio" onAgregar={movimientos.agregarDomicilio} />
        )}
        <ListaMovimientos
          items={estado.domicilios.map((d) => ({
            id: d.id,
            etiqueta: d.descripcion,
            monto: d.monto,
          }))}
          bloqueado={bloqueado}
          edicion={{
            tipo: 'texto',
            placeholder: 'Detalle (opcional)',
            onChange: movimientos.editarDomicilio,
          }}
          onEliminar={movimientos.quitarDomicilio}
        />
      </Bloque>

      <Bloque icono={<Wallet size={18} />} titulo="Efectivo en caja">
        <BaseCaja cierre={cierre} />
        <label className="flex flex-col gap-1.5">
          <span className="text-brand-strong text-xs font-bold">Dinero contado al cerrar</span>
          <InputPeso
            value={estado.dineroFinal}
            onChange={(n) => actualizar({ dineroFinal: n })}
            disabled={bloqueado}
            placeholder="$0"
            className="input border-brand/50 w-full text-lg font-extrabold tabular-nums"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-bold">Notas del día (opcional)</span>
          <textarea
            value={estado.observaciones}
            onChange={(e) => actualizar({ observaciones: e.target.value })}
            disabled={bloqueado}
            rows={2}
            maxLength={500}
            className="input w-full resize-none py-2.5"
            placeholder="Ej. se fue la luz una hora"
          />
        </label>
      </Bloque>
    </div>
  )
}
