'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Plus,
  Receipt,
  Wallet,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InputPeso } from '@/components/ui/InputPeso'
import { modalContent, modalOverlay } from '@/lib/animations'
import { formatPesos } from '@/lib/utils'
import { calcularCuadre } from '@/hooks/useCuadre'

type LineaMonto = { id: string; descripcion: string; monto: number }
type CuadreResult = ReturnType<typeof calcularCuadre>
type SeccionId = 'gastos' | 'transferencias' | 'caja'

interface CierreCajaShellProps {
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

function etiquetaCuadre(
  tieneContado: boolean,
  diferencia: number
): { texto: string; className: string } {
  if (!tieneContado) {
    return { texto: 'Pendiente', className: 'bg-bg-elevated text-text-secondary' }
  }
  if (diferencia === 0) {
    return {
      texto: 'Cuadre OK',
      className: 'bg-accent-green-dim text-accent-green',
    }
  }
  if (diferencia < 0) {
    return {
      texto: `Falta ${formatPesos(Math.abs(diferencia))}`,
      className: 'bg-accent-red-dim text-accent-red',
    }
  }
  return {
    texto: `Sobra ${formatPesos(diferencia)}`,
    className: 'bg-amber-500/15 text-amber-400',
  }
}

/** Barra fija + drawer de resumen de caja (reemplaza el panel lateral apretado) */
export function CierreCajaShell({
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
}: CierreCajaShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [abiertas, setAbiertas] = useState<Set<SeccionId>>(
    () => new Set<SeccionId>(['gastos', 'caja'])
  )

  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  function toggleSeccion(s: SeccionId) {
    setAbiertas((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const tieneContado = dineroFinal > 0
  const badge = etiquetaCuadre(tieneContado, cuadre.diferencia)
  const esperado = esAdmin
    ? cuadre.efectivoEsperado
    : cuadre.dineroEsperadoEnCaja
  const nMovimientos = gastos.length + transferencias.length

  return (
    <>
      {/* Espacio para que el contenido no quede bajo la barra */}
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom,0px))] shrink-0" aria-hidden />

      {/* Barra sticky inferior */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bg-border bg-bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:left-60">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span
            className={[
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              badge.className,
            ].join(' ')}
          >
            {badge.texto}
          </span>

          <div className="hidden min-w-0 flex-1 items-center gap-4 sm:flex">
            <div className="text-xs">
              <span className="text-text-secondary">Esperado </span>
              <span className="font-semibold text-text-primary tabular-nums">
                {formatPesos(esperado)}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-text-secondary">Contado </span>
              <span className="font-semibold text-text-primary tabular-nums">
                {formatPesos(dineroFinal)}
              </span>
            </div>
            {(cuadre.totalGastos > 0 || cuadre.totalTransferencias > 0) && (
              <div className="text-xs text-text-secondary">
                {nMovimientos} mov.
              </div>
            )}
          </div>

          <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="h-10 flex-1 gap-1.5 sm:flex-none"
              onClick={() => setDrawerOpen(true)}
            >
              <Wallet size={16} aria-hidden />
              Resumen de caja
              {nMovimientos > 0 && (
                <span className="ml-0.5 rounded-full bg-bg-elevated px-1.5 text-[10px] font-semibold text-text-secondary tabular-nums">
                  {nMovimientos}
                </span>
              )}
            </Button>
            {!bloqueado && (
              <Button
                type="button"
                loading={guardando}
                className="h-10 flex-1 sm:min-w-[8.5rem] sm:flex-none"
                onClick={onCerrarDia}
              >
                Cerrar día
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal centrado — resumen de caja */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              aria-label="Cerrar resumen"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              variants={modalOverlay}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal
              aria-label="Resumen de caja"
              className="relative z-10 flex max-h-[min(90dvh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface/95 shadow-glow-cyan-strong backdrop-blur-xl"
              variants={modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-bg-border px-5 py-4">
                <div>
                  <p className="font-display text-lg font-semibold text-text-primary">
                    Resumen de caja
                  </p>
                  <p className="text-xs text-text-secondary">
                    Gastos, transferencias y efectivo del día
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                data-lenis-prevent
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4"
              >
                <SeccionAcordeon
                  emoji="💸"
                  titulo="Gastos del día"
                  total={cuadre.totalGastos}
                  items={gastos}
                  abierta={abiertas.has('gastos')}
                  colorTotal="text-accent-red"
                  bloqueado={bloqueado}
                  onToggle={() => toggleSeccion('gastos')}
                  onAgregar={onAgregarGasto}
                  onEliminar={onRemoveGasto}
                />

                <SeccionAcordeon
                  emoji="📱"
                  titulo="Transferencias"
                  total={cuadre.totalTransferencias}
                  items={transferencias}
                  abierta={abiertas.has('transferencias')}
                  colorTotal="text-text-secondary"
                  bloqueado={bloqueado}
                  onToggle={() => toggleSeccion('transferencias')}
                  onAgregar={onAgregarTransferencia}
                  onEliminar={onRemoveTransferencia}
                />

                <div className="overflow-hidden rounded-[var(--radius-md)] border border-bg-border">
                  <button
                    type="button"
                    onClick={() => toggleSeccion('caja')}
                    className="flex w-full items-center justify-between p-3.5 transition-colors hover:bg-bg-elevated/50"
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden>💰</span>
                      <span className="text-sm font-medium text-text-primary">
                        Caja
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dineroFinal > 0 && (
                        <span className="text-xs font-semibold text-text-primary tabular-nums">
                          {formatPesos(dineroFinal)}
                        </span>
                      )}
                      <motion.div
                        animate={{
                          rotate: abiertas.has('caja') ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown
                          size={14}
                          className="text-text-secondary"
                          aria-hidden
                        />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {abiertas.has('caja') && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-bg-border p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label
                                htmlFor="cierre-base"
                                className="text-xs font-medium text-text-secondary"
                              >
                                Base inicio
                              </label>
                              <InputPeso
                                id="cierre-base"
                                value={dineroBase}
                                onChange={onDineroBaseChange}
                                disabled={bloqueado}
                                className="select-field w-full py-2.5 text-sm tabular-nums"
                              />
                              <p className="text-[11px] text-text-secondary">
                                Del día anterior
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <label
                                htmlFor="cierre-final"
                                className="text-xs font-medium text-text-secondary"
                              >
                                Dinero final
                              </label>
                              <InputPeso
                                id="cierre-final"
                                value={dineroFinal}
                                onChange={onDineroFinalChange}
                                disabled={bloqueado}
                                className="select-field w-full py-2.5 text-sm font-semibold tabular-nums"
                              />
                              <p className="text-[11px] text-text-secondary">
                                Lo que contaron
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cuadre detallado en el drawer */}
                <div className="space-y-3 rounded-[var(--radius-md)] border border-bg-border p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    <Receipt size={14} aria-hidden />
                    Resultado del cuadre
                  </p>

                  {esAdmin && (
                    <div className="space-y-2">
                      <Fila
                        label="Vendido"
                        valor={formatPesos(cuadre.totalVentas)}
                        className="text-accent-cyan"
                      />
                      <Fila
                        label="− Transferencias"
                        valor={formatPesos(cuadre.totalTransferencias)}
                      />
                      <Fila
                        label="− Gastos"
                        valor={formatPesos(cuadre.totalGastos)}
                      />
                      <Fila
                        label="Esperado en caja"
                        valor={formatPesos(cuadre.efectivoEsperado)}
                        bold
                      />
                    </div>
                  )}

                  {!esAdmin && (
                    <Fila
                      label="Esperado en caja"
                      valor={formatPesos(cuadre.dineroEsperadoEnCaja)}
                      bold
                    />
                  )}

                  <div
                    className={[
                      'flex items-center justify-between rounded-[var(--radius-md)] p-3',
                      badge.className.includes('green')
                        ? 'bg-accent-green-dim'
                        : badge.className.includes('red')
                          ? 'bg-accent-red-dim'
                          : badge.className.includes('amber')
                            ? 'bg-amber-500/15'
                            : 'bg-bg-elevated',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-semibold ${badge.className.split(' ').pop()}`}>
                      {tieneContado
                        ? badge.texto === 'Cuadre OK'
                          ? '✓ Cuadre perfecto'
                          : badge.texto
                        : 'Pendiente de conteo'}
                    </span>
                    <span className="text-xs font-medium text-text-primary tabular-nums">
                      {formatPesos(dineroFinal)} contado
                    </span>
                  </div>
                </div>
              </div>

              {!bloqueado && (
                <div className="border-t border-bg-border p-4">
                  <Button
                    type="button"
                    loading={guardando}
                    className="h-11 w-full text-sm font-semibold"
                    onClick={() => {
                      setDrawerOpen(false)
                      onCerrarDia()
                    }}
                  >
                    Cerrar día
                  </Button>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** @deprecated Usar CierreCajaShell */
export const CierrePanelSticky = CierreCajaShell

function Fila({
  label,
  valor,
  className,
  bold,
}: {
  label: string
  valor: string
  className?: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span
        className={[
          'tabular-nums',
          bold ? 'font-semibold text-text-primary' : 'text-text-primary',
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

function SeccionAcordeon({
  emoji,
  titulo,
  total,
  items,
  abierta,
  colorTotal,
  bloqueado,
  onToggle,
  onAgregar,
  onEliminar,
}: {
  emoji: string
  titulo: string
  total: number
  items: LineaMonto[]
  abierta: boolean
  colorTotal: string
  bloqueado: boolean
  onToggle: () => void
  onAgregar: (desc: string, monto: number) => void
  onEliminar: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-bg-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3.5 transition-colors hover:bg-bg-elevated/50"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden>{emoji}</span>
          <span className="text-sm font-medium text-text-primary">{titulo}</span>
          {items.length > 0 && (
            <span className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-xs font-medium text-text-secondary tabular-nums">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {total > 0 && (
            <span className={`text-xs font-semibold tabular-nums ${colorTotal}`}>
              {formatPesos(total)}
            </span>
          )}
          <motion.div
            animate={{ rotate: abierta ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-text-secondary" aria-hidden />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-bg-border px-3.5 pb-3.5">
              {!bloqueado && (
                <div className="pt-3">
                  <InputItem
                    onAgregar={onAgregar}
                    placeholderDesc={
                      titulo.toLowerCase().includes('transfer')
                        ? 'Ej. Nequi, Bancolombia…'
                        : 'Ej. gasolina, mercado…'
                    }
                  />
                </div>
              )}

              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <ItemLista
                    key={item.id}
                    descripcion={item.descripcion}
                    monto={item.monto}
                    bloqueado={bloqueado}
                    onEliminar={() => onEliminar(item.id)}
                  />
                ))}
              </AnimatePresence>

              {items.length === 0 && (
                <p className="py-2 text-xs text-text-secondary">
                  Sin registros aún
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InputItem({
  onAgregar,
  placeholderDesc = 'Descripción',
}: {
  onAgregar: (desc: string, monto: number) => void
  placeholderDesc?: string
}) {
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState(0)

  function handleAgregar() {
    const descripcion = desc.trim()
    if (!descripcion || monto <= 0) return
    onAgregar(descripcion, monto)
    setDesc('')
    setMonto(0)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAgregar()
          }
        }}
        placeholder={placeholderDesc}
        className="input min-w-0 flex-1 placeholder:text-text-secondary"
      />
      <InputPeso
        value={monto}
        onChange={setMonto}
        placeholder="Monto $"
        className="input w-[7.5rem] shrink-0 tabular-nums placeholder:text-text-secondary"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAgregar()
          }
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleAgregar()
        }}
        aria-label="Agregar"
        disabled={!desc.trim() || monto <= 0}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-cyan-dim text-accent-cyan transition-colors hover:bg-accent-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  )
}

function ItemLista({
  descripcion,
  monto,
  bloqueado,
  onEliminar,
}: {
  descripcion: string
  monto: number
  bloqueado: boolean
  onEliminar: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="group flex items-center justify-between py-2"
    >
      <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
        {descripcion}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {formatPesos(monto)}
        </span>
        {!bloqueado && (
          <button
            type="button"
            onClick={onEliminar}
            aria-label="Eliminar"
            className="flex h-7 w-7 items-center justify-center rounded text-text-secondary opacity-70 transition-all hover:bg-accent-red-dim hover:text-accent-red group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
    </motion.div>
  )
}
