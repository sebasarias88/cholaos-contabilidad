'use client'

import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { InputPeso } from '@/components/ui/InputPeso'
import { ListaMovimientos } from '@/components/cierre/caja/ListaMovimientos'
import { NuevoMovimiento } from '@/components/cierre/caja/NuevoMovimiento'
import { SeccionAcordeon } from '@/components/cierre/caja/SeccionAcordeon'
import { etiquetaCuadre } from '@/components/cierre/caja/etiquetaCuadre'
import type { CierreDiaApi } from '@/hooks/useCierreDia'
import { formatPesos } from '@/lib/utils'

type Seccion = 'gastos' | 'transferencias' | 'domicilios' | 'caja'

function Fila({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`text-text-primary tabular-nums ${fuerte ? 'font-semibold' : ''}`}>
        {valor}
      </span>
    </div>
  )
}

/** Gastos, transferencias, domicilios, caja y resultado del cuadre */
export function ResumenCajaModal({
  open,
  onClose,
  cierre,
}: {
  open: boolean
  onClose: () => void
  cierre: CierreDiaApi
}) {
  const [abiertas, setAbiertas] = useState<Set<Seccion>>(() => new Set(['gastos', 'caja']))
  const { estado, cuadre, bloqueado, esAdmin, movimientos, actualizar } = cierre
  const medios = cierre.datos?.medios ?? []
  const badge = etiquetaCuadre(estado.dineroFinal, cuadre.diferencia)

  const toggle = (s: Seccion) =>
    setAbiertas((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })

  return (
    <Modal open={open} onClose={onClose} title="Resumen de caja">
      <div className="-mx-1 max-h-[65dvh] space-y-3 overflow-y-auto overscroll-contain px-1">
        <SeccionAcordeon
          emoji="💸"
          titulo="Gastos del día"
          total={cuadre.totalGastos}
          cantidad={estado.gastos.length}
          colorTotal="text-accent-red"
          abierta={abiertas.has('gastos')}
          onToggle={() => toggle('gastos')}
        >
          {!bloqueado && <NuevoMovimiento tipo="gasto" onAgregar={movimientos.agregarGasto} />}
          <ListaMovimientos
            items={estado.gastos.map((g) => ({
              id: g.id,
              etiqueta: g.descripcion,
              monto: g.monto,
            }))}
            bloqueado={bloqueado}
            edicion={{
              tipo: 'texto',
              placeholder: 'Ej. gasolina, mercado…',
              onChange: movimientos.editarGasto,
            }}
            onEliminar={movimientos.quitarGasto}
          />
        </SeccionAcordeon>

        <SeccionAcordeon
          emoji="📱"
          titulo="Transferencias"
          total={cuadre.totalTransferencias}
          cantidad={estado.transferencias.length}
          abierta={abiertas.has('transferencias')}
          onToggle={() => toggle('transferencias')}
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
        </SeccionAcordeon>

        <SeccionAcordeon
          emoji="🛵"
          titulo="Domicilios"
          total={cuadre.totalDomicilios}
          cantidad={estado.domicilios.length}
          colorTotal="text-amber-400"
          abierta={abiertas.has('domicilios')}
          onToggle={() => toggle('domicilios')}
        >
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
        </SeccionAcordeon>

        <SeccionAcordeon
          emoji="💰"
          titulo="Caja"
          total={estado.dineroFinal}
          abierta={abiertas.has('caja')}
          onToggle={() => toggle('caja')}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="cierre-base" className="text-text-secondary text-xs font-medium">
                Base inicio
              </label>
              <InputPeso
                id="cierre-base"
                value={estado.dineroBase}
                onChange={(n) => actualizar({ dineroBase: n })}
                disabled={bloqueado || !esAdmin}
                className="select-field w-full py-2.5 text-sm tabular-nums"
              />
              <p className="text-text-secondary text-[11px]">Del último cierre</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cierre-final" className="text-text-secondary text-xs font-medium">
                Dinero final
              </label>
              <InputPeso
                id="cierre-final"
                value={estado.dineroFinal}
                onChange={(n) => actualizar({ dineroFinal: n })}
                disabled={bloqueado}
                className="select-field w-full py-2.5 text-sm font-semibold tabular-nums"
              />
              <p className="text-text-secondary text-[11px]">Lo que contaron</p>
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <label htmlFor="cierre-notas" className="text-text-secondary text-xs font-medium">
              Notas del día (opcional)
            </label>
            <textarea
              id="cierre-notas"
              value={estado.observaciones}
              onChange={(e) => actualizar({ observaciones: e.target.value })}
              disabled={bloqueado}
              rows={2}
              maxLength={500}
              className="input w-full resize-none py-2 text-sm"
              placeholder="Ej. se fue la luz una hora"
            />
          </div>
        </SeccionAcordeon>

        <div className="border-bg-border space-y-3 rounded-[var(--radius-md)] border p-4">
          <p className="text-text-secondary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Receipt size={14} aria-hidden />
            Resultado del cuadre
          </p>
          <div className="space-y-2">
            {esAdmin && <Fila label="Vendido" valor={formatPesos(cuadre.totalVentas)} />}
            {esAdmin && (
              <Fila label="− Transferencias" valor={formatPesos(cuadre.totalTransferencias)} />
            )}
            {esAdmin && <Fila label="− Gastos" valor={formatPesos(cuadre.totalGastos)} />}
            {esAdmin && <Fila label="− Domicilios" valor={formatPesos(cuadre.totalDomicilios)} />}
            <Fila label="Esperado en caja" valor={formatPesos(cuadre.efectivoEsperado)} fuerte />
          </div>
          <div
            className={`flex items-center justify-between rounded-[var(--radius-md)] p-3 ${badge.clase}`}
          >
            <span className="text-sm font-semibold">{badge.texto}</span>
            <span className="text-xs font-medium tabular-nums">
              {formatPesos(estado.dineroFinal)} contado
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
