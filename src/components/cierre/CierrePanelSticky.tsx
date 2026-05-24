'use client'

import { useState } from 'react'
import {
  ArrowLeftRight,
  Banknote,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InputPeso } from '@/components/ui/InputPeso'
import { formatPesos, parsePesosInput } from '@/lib/utils'
import { calcularCuadre } from '@/hooks/useCuadre'

type LineaMonto = { id: string; descripcion: string; monto: number }
type CuadreResult = ReturnType<typeof calcularCuadre>

interface CierrePanelStickyProps {
  bloqueado: boolean
  esAdmin: boolean
  guardando: boolean
  cuadre: CuadreResult
  dineroFinal: number
  dineroBase: number
  gastos: LineaMonto[]
  transferencias: LineaMonto[]
  onDineroBaseChange: (n: number) => void
  onDineroFinalChange: (n: number) => void
  onRemoveGasto: (id: string) => void
  onRemoveTransferencia: (id: string) => void
  onAgregarGasto: (d: string, m: number) => void
  onAgregarTransferencia: (d: string, m: number) => void
  onCerrarDia: () => void
}

export function CierrePanelSticky({
  bloqueado,
  esAdmin,
  guardando,
  cuadre,
  dineroFinal,
  dineroBase,
  gastos,
  transferencias,
  onDineroBaseChange,
  onDineroFinalChange,
  onRemoveGasto,
  onRemoveTransferencia,
  onAgregarGasto,
  onAgregarTransferencia,
  onCerrarDia,
}: CierrePanelStickyProps) {
  const [addGasto, setAddGasto] = useState(false)
  const [addTrans, setAddTrans] = useState(false)
  const [gastoDesc, setGastoDesc] = useState('')
  const [gastoMonto, setGastoMonto] = useState('')
  const [transDesc, setTransDesc] = useState('')
  const [transMonto, setTransMonto] = useState('')

  const estadoCuadre =
    dineroFinal <= 0
      ? 'pendiente'
      : cuadre.cuadreOk
        ? 'ok'
        : cuadre.diferencia < 0
          ? 'falta'
          : 'sobra'

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        data-lenis-prevent
        className="scroll-touch scroll-thin min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-4"
      >
        <header className="space-y-1 px-0.5">
          <p className="font-display text-base font-semibold text-text-primary">
            Resumen de caja
          </p>
          <p className="text-xs leading-relaxed text-text-muted">
            Registra efectivo, gastos y transferencias antes de cerrar.
          </p>
        </header>

        {/* Caja — siempre visible, protagonista */}
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-bg-border bg-bg-elevated/50 px-4 py-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent-cyan-dim text-accent-cyan">
              <Wallet size={16} aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Caja</h3>
              <p className="text-[11px] text-text-muted">Efectivo al inicio y al cierre</p>
            </div>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field label="Base inicio" htmlFor="cierre-base" hint="Al abrir el día">
              <InputPeso
                id="cierre-base"
                value={dineroBase}
                onChange={onDineroBaseChange}
                disabled={bloqueado}
                className="select-field w-full bg-accent-cyan-dim/10 py-2.5 text-sm tabular-nums"
              />
            </Field>
            <Field label="Final contado" htmlFor="cierre-final" hint="Lo que hay en caja">
              <InputPeso
                id="cierre-final"
                value={dineroFinal}
                onChange={onDineroFinalChange}
                disabled={bloqueado}
                className="select-field w-full py-2.5 text-sm font-medium tabular-nums"
              />
            </Field>
          </div>
        </section>

        <p className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Movimientos del día
        </p>

        <BloqueMovimientos
          icon={Receipt}
          titulo="Gastos"
          subtitulo="Compras e insumos"
          total={cuadre.totalGastos}
          items={gastos}
          vacio="Aún no hay gastos registrados"
          bloqueado={bloqueado}
          onRemove={onRemoveGasto}
          addOpen={addGasto}
          onAddOpen={() => setAddGasto(true)}
          onAddClose={() => setAddGasto(false)}
          addLabel="Agregar gasto"
          desc={gastoDesc}
          monto={gastoMonto}
          onDesc={setGastoDesc}
          onMonto={setGastoMonto}
          onSubmit={() => {
            const d = gastoDesc.trim()
            const m = parsePesosInput(gastoMonto)
            if (!d || m <= 0) return
            onAgregarGasto(d, m)
            setGastoDesc('')
            setGastoMonto('')
            setAddGasto(false)
          }}
        />

        <BloqueMovimientos
          icon={ArrowLeftRight}
          titulo="Transferencias"
          subtitulo="Nequi, Daviplata, etc."
          total={cuadre.totalTransferencias}
          items={transferencias}
          vacio="Aún no hay transferencias"
          bloqueado={bloqueado}
          onRemove={onRemoveTransferencia}
          addOpen={addTrans}
          onAddOpen={() => setAddTrans(true)}
          onAddClose={() => setAddTrans(false)}
          addLabel="Agregar transferencia"
          desc={transDesc}
          monto={transMonto}
          onDesc={setTransDesc}
          onMonto={setTransMonto}
          onSubmit={() => {
            const d = transDesc.trim()
            const m = parsePesosInput(transMonto)
            if (!d || m <= 0) return
            onAgregarTransferencia(d, m)
            setTransDesc('')
            setTransMonto('')
            setAddTrans(false)
          }}
        />
      </div>

      {/* Cuadre — anclado abajo */}
      <div className="shrink-0 border-t border-bg-border bg-bg-base/95 pt-4 backdrop-blur-sm">
        <div
          className={[
            'overflow-hidden rounded-[var(--radius-lg)] border p-4 sm:p-5',
            estadoCuadre === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
              : estadoCuadre === 'falta'
                ? 'border-accent-red/25 bg-accent-red-dim/30'
                : estadoCuadre === 'sobra'
                  ? 'border-amber-500/25 bg-amber-500/[0.06]'
                  : 'border-bg-border bg-bg-surface',
          ].join(' ')}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary">
                <Banknote size={16} aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Resultado del cuadre
                </h3>
                <p className="text-[11px] text-text-muted">Esperado vs contado</p>
              </div>
            </div>
            <BadgeCuadre estado={estadoCuadre} diferencia={cuadre.diferencia} />
          </div>

          {esAdmin && (
            <dl className="mb-4 space-y-2.5 border-b border-bg-border/80 pb-4">
              <FilaCuadre label="Vendido" valor={formatPesos(cuadre.totalVentas)} destacado />
              <FilaCuadre
                label="Transferencias"
                valor={`− ${formatPesos(cuadre.totalTransferencias)}`}
              />
              <FilaCuadre label="Gastos" valor={`− ${formatPesos(cuadre.totalGastos)}`} />
              <FilaCuadre
                label="Esperado en caja"
                valor={formatPesos(cuadre.efectivoEsperado)}
                bold
              />
            </dl>
          )}

          {!esAdmin && (
            <p className="mb-4 flex justify-between border-b border-bg-border/80 pb-4 text-sm">
              <span className="text-text-muted">Esperado en caja</span>
              <span className="font-medium tabular-nums">
                {formatPesos(cuadre.dineroEsperadoEnCaja)}
              </span>
            </p>
          )}

          <div className="mb-4 flex items-end justify-between gap-3">
            <span className="text-sm text-text-secondary">Contado</span>
            <span className="text-2xl font-bold tabular-nums tracking-tight text-text-primary">
              {formatPesos(dineroFinal)}
            </span>
          </div>

          {!bloqueado && (
            <Button
              type="button"
              loading={guardando}
              className="h-11 w-full text-sm font-semibold"
              onClick={onCerrarDia}
            >
              Cerrar día
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function BloqueMovimientos({
  icon: Icon,
  titulo,
  subtitulo,
  total,
  items,
  vacio,
  bloqueado,
  onRemove,
  addOpen,
  onAddOpen,
  onAddClose,
  addLabel,
  desc,
  monto,
  onDesc,
  onMonto,
  onSubmit,
}: {
  icon: typeof Receipt
  titulo: string
  subtitulo: string
  total: number
  items: LineaMonto[]
  vacio: string
  bloqueado: boolean
  onRemove: (id: string) => void
  addOpen: boolean
  onAddOpen: () => void
  onAddClose: () => void
  addLabel: string
  desc: string
  monto: string
  onDesc: (v: string) => void
  onMonto: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-bg-border bg-bg-elevated/40 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary">
            <Icon size={16} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">{titulo}</h3>
            <p className="truncate text-[11px] text-text-muted">{subtitulo}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-accent-cyan-dim px-2.5 py-1 text-xs font-semibold tabular-nums text-accent-cyan">
          {formatPesos(total)}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <ListaMonto
          items={items}
          vacio={vacio}
          bloqueado={bloqueado}
          onRemove={onRemove}
        />

        {!bloqueado && (
          <FormAdd
            open={addOpen}
            onOpen={onAddOpen}
            onClose={onAddClose}
            label={addLabel}
            desc={desc}
            monto={monto}
            onDesc={onDesc}
            onMonto={onMonto}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </section>
  )
}

function ListaMonto({
  items,
  vacio,
  bloqueado,
  onRemove,
}: {
  items: LineaMonto[]
  vacio: string
  bloqueado: boolean
  onRemove: (id: string) => void
}) {
  if (!items.length) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-bg-border/80 bg-bg-elevated/30 px-3 py-4 text-center text-xs leading-relaxed text-text-muted">
        {vacio}
      </p>
    )
  }

  return (
    <ul className="max-h-44 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
      {items.map((x) => (
        <li
          key={x.id}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-bg-elevated/60 px-3 py-2.5"
        >
          <span className="min-w-0 truncate text-sm text-text-primary">
            {x.descripcion}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium tabular-nums text-text-secondary">
              {formatPesos(x.monto)}
            </span>
            {!bloqueado && (
              <button
                type="button"
                aria-label="Eliminar"
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-text-muted transition-colors hover:bg-accent-red-dim hover:text-accent-red"
                onClick={() => onRemove(x.id)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

function FormAdd({
  open,
  onOpen,
  onClose,
  label,
  desc,
  monto,
  onDesc,
  onMonto,
  onSubmit,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  label: string
  desc: string
  monto: string
  onDesc: (v: string) => void
  onMonto: (v: string) => void
  onSubmit: () => void
}) {
  if (open) {
    return (
      <div className="space-y-3 rounded-[var(--radius-md)] border border-bg-border bg-bg-elevated/40 p-3">
        <input
          type="text"
          placeholder="Descripción"
          value={desc}
          onChange={(e) => onDesc(e.target.value)}
          className="select-field w-full py-2.5 text-sm"
          autoFocus
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Monto"
          value={monto}
          onChange={(e) => onMonto(e.target.value)}
          className="select-field w-full py-2.5 text-sm tabular-nums"
        />
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" className="flex-1" onClick={onSubmit}>
            Guardar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-bg-border py-2.5 text-xs font-medium text-text-muted transition-colors hover:border-accent-cyan/40 hover:bg-accent-cyan-dim/20 hover:text-accent-cyan"
    >
      <Plus size={14} aria-hidden />
      {label}
    </button>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-text-secondary">
        {label}
      </label>
      {hint && <p className="text-[10px] text-text-muted">{hint}</p>}
      {children}
    </div>
  )
}

function FilaCuadre({
  label,
  valor,
  destacado,
  bold,
}: {
  label: string
  valor: string
  destacado?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd
        className={[
          'tabular-nums',
          destacado ? 'font-medium text-accent-cyan' : '',
          bold ? 'font-semibold text-text-primary' : 'text-text-secondary',
        ].join(' ')}
      >
        {valor}
      </dd>
    </div>
  )
}

function BadgeCuadre({
  estado,
  diferencia,
}: {
  estado: 'pendiente' | 'ok' | 'falta' | 'sobra'
  diferencia: number
}) {
  const styles =
    estado === 'ok'
      ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25'
      : estado === 'falta'
        ? 'bg-accent-red-dim text-accent-red ring-accent-red/20'
        : estado === 'sobra'
          ? 'bg-amber-500/15 text-amber-400 ring-amber-500/25'
          : 'bg-bg-elevated text-text-muted ring-bg-border'

  const text =
    estado === 'ok'
      ? 'Cuadre OK'
      : estado === 'falta'
        ? `Falta ${formatPesos(Math.abs(diferencia))}`
        : estado === 'sobra'
          ? `Sobra ${formatPesos(diferencia)}`
          : 'Pendiente'

  return (
    <span
      className={[
        'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        styles,
      ].join(' ')}
    >
      {text}
    </span>
  )
}
