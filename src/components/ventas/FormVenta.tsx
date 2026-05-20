'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { CantidadStepper } from '@/components/ventas/CantidadStepper'
import {
  CierreBottomSheet,
  type ItemCierre,
} from '@/components/ventas/CierreBottomSheet'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { formatPesos } from '@/lib/utils'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Producto } from '@/types'

/** Espacio bajo el catálogo para que el carrito flotante no tape contenido (móvil) */
const MOBILE_DOCK_SPACER =
  'h-[calc(5.75rem+1rem+env(safe-area-inset-bottom,0px))] shrink-0'

function agruparPorNombre(productos: Producto[]) {
  const map = new Map<string, Producto[]>()
  for (const p of productos) {
    const list = map.get(p.nombre) ?? []
    list.push(p)
    map.set(p.nombre, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.onzas - b.onzas)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

/** Catálogo agrupado — ideal para móvil */
function GrupoProductoMobile({
  nombre,
  variantes,
  cantidades,
  onCantidadChange,
}: {
  nombre: string
  variantes: Producto[]
  cantidades: Record<string, number>
  onCantidadChange: (id: string, cantidad: number) => void
}) {
  const haySeleccion = variantes.some((p) => (cantidades[p.id] ?? 0) > 0)

  return (
    <article
      className={[
        'overflow-hidden rounded-[var(--radius-xl)] border bg-bg-surface transition-surface',
        haySeleccion
          ? 'border-accent-cyan/35 shadow-glow-cyan'
          : 'border-bg-border',
      ].join(' ')}
    >
      <header className="border-b border-bg-border bg-bg-elevated/60 px-4 py-3">
        <h2 className="font-display text-base font-semibold capitalize text-text-primary">
          {nombre}
        </h2>
      </header>
      <ul className="divide-y divide-bg-border">
        {variantes.map((p) => {
          const cantidad = cantidades[p.id] ?? 0
          const subtotal = cantidad * p.precio
          return (
            <li
              key={p.id}
              className={[
                'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
                cantidad > 0 ? 'bg-accent-cyan-dim/20' : '',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold tabular-nums text-text-primary">
                    {p.onzas} oz
                  </span>
                  <span className="text-sm text-text-secondary">
                    {formatPesos(p.precio)}
                  </span>
                </div>
                {cantidad > 0 && (
                  <p className="mt-1 text-sm font-medium text-accent-cyan tabular-nums">
                    Subtotal {formatPesos(subtotal)}
                  </p>
                )}
              </div>
              <CantidadStepper
                value={cantidad}
                onChange={(n) => onCantidadChange(p.id, n)}
                aria-label={`Cantidad ${nombre} ${p.onzas} onzas`}
              />
            </li>
          )
        })}
      </ul>
    </article>
  )
}

/** Tarjeta individual — escritorio */
function ProductoVarianteCard({
  producto,
  nombreGrupo,
  cantidad,
  onCantidadChange,
}: {
  producto: Producto
  nombreGrupo: string
  cantidad: number
  onCantidadChange: (cantidad: number) => void
}) {
  const subtotal = cantidad * producto.precio
  const activo = cantidad > 0

  return (
    <motion.div
      layout
      variants={fadeUp}
      className={[
        'flex flex-col rounded-[var(--radius-lg)] border bg-bg-surface p-4 transition-surface',
        activo
          ? 'border-accent-cyan/40 shadow-glow-cyan'
          : 'border-bg-border',
      ].join(' ')}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium tabular-nums text-text-primary">
            {producto.onzas} oz
          </p>
          <p className="text-sm text-text-secondary">
            {formatPesos(producto.precio)} / vaso
          </p>
        </div>
        {activo && (
          <span className="badge-cyan shrink-0 tabular-nums">
            {formatPesos(subtotal)}
          </span>
        )}
      </div>
      <div className="mt-4 flex justify-center">
        <CantidadStepper
          value={cantidad}
          onChange={onCantidadChange}
          aria-label={`Cantidad ${nombreGrupo} ${producto.onzas} oz`}
        />
      </div>
    </motion.div>
  )
}

function ListaResumenItems({ items }: { items: ItemCierre[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Selecciona productos y cantidades para armar el cierre.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map(({ producto, cantidad, subtotal }) => (
        <li
          key={producto.id}
          className="flex justify-between gap-2 text-sm"
        >
          <span className="min-w-0 text-text-secondary">
            <span className="capitalize text-text-primary">{producto.nombre}</span>{' '}
            {producto.onzas}oz × {cantidad}
          </span>
          <span className="shrink-0 font-medium text-accent-cyan tabular-nums">
            {formatPesos(subtotal)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function FormVenta() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [busqueda, setBusqueda] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setLoadingProductos(true)
    fetch('/api/productos')
      .then((r) => r.json())
      .then((data: Producto[]) => setProductos(data))
      .catch(() => toast.error('Error cargando productos'))
      .finally(() => setLoadingProductos(false))
  }, [])

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return agruparPorNombre(productos).filter(([nombre]) =>
      !q ? true : nombre.toLowerCase().includes(q)
    )
  }, [productos, busqueda])

  const itemsSeleccionados = useMemo((): ItemCierre[] => {
    return productos
      .filter((p) => (cantidades[p.id] ?? 0) > 0)
      .map((p) => {
        const cantidad = cantidades[p.id] ?? 0
        return {
          producto: p,
          cantidad,
          subtotal: cantidad * p.precio,
        }
      })
  }, [productos, cantidades])

  const total = itemsSeleccionados.reduce((s, i) => s + i.subtotal, 0)
  const totalVasos = itemsSeleccionados.reduce((s, i) => s + i.cantidad, 0)
  const tieneItems = itemsSeleccionados.length > 0

  function setCantidadProducto(productoId: string, cantidad: number) {
    setCantidades((prev) => ({ ...prev, [productoId]: Math.max(0, cantidad) }))
  }

  function limpiarFormulario() {
    setCantidades({})
    setObservaciones('')
    setBusqueda('')
    setModalOpen(false)
    setSheetOpen(false)
  }

  function abrirRevision() {
    if (!tieneItems) {
      toastError('Agrega al menos un producto con cantidad mayor a 0')
      return
    }
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setModalOpen(true)
    } else {
      setSheetOpen(true)
    }
  }

  async function handleConfirmar() {
    setGuardando(true)
    const toastId = toastLoading('Guardando venta...')

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        observaciones: observaciones.trim() || undefined,
        items: itemsSeleccionados.map(({ producto, cantidad }) => ({
          producto_id: producto.id,
          cantidad,
          precio_unitario: producto.precio,
        })),
      }),
    })

    setGuardando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError(
        (data as { error?: string }).error ?? 'Error al guardar. Intenta de nuevo.',
        toastId
      )
      return
    }

    toastSuccess('Cierre del día registrado correctamente', toastId)
    limpiarFormulario()
  }

  return (
    <>
      <motion.div
        className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div
          className={[
            'min-w-0 flex-1 space-y-4 lg:space-y-6',
            tieneItems
              ? 'max-lg:pb-[calc(5.75rem+1.25rem+env(safe-area-inset-bottom,0px))]'
              : '',
          ].join(' ')}
        >
          <motion.div variants={fadeUp}>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="select-field select-field--with-icon w-full min-w-0"
              />
            </div>
          </motion.div>

          {loadingProductos ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[var(--radius-xl)]" />
              ))}
            </div>
          ) : grupos.length === 0 ? (
            <p className="text-sm text-text-muted">
              {busqueda
                ? 'No hay productos que coincidan con la búsqueda.'
                : 'No hay productos activos en el catálogo.'}
            </p>
          ) : (
            <>
              {/* Móvil y tablet: listas agrupadas */}
              <div className="space-y-4 lg:hidden">
                {grupos.map(([nombre, variantes]) => (
                  <GrupoProductoMobile
                    key={nombre}
                    nombre={nombre}
                    variantes={variantes}
                    cantidades={cantidades}
                    onCantidadChange={setCantidadProducto}
                  />
                ))}
              </div>

              {/* Escritorio: grid de tarjetas */}
              <div className="hidden space-y-6 lg:block">
                {grupos.map(([nombre, variantes]) => (
                  <section key={nombre} className="space-y-3">
                    <h2 className="font-display text-lg font-semibold capitalize text-text-primary">
                      {nombre}
                    </h2>
                    <motion.div
                      className="grid gap-3 xl:grid-cols-3"
                      variants={staggerContainer}
                    >
                      {variantes.map((p) => (
                        <ProductoVarianteCard
                          key={p.id}
                          producto={p}
                          nombreGrupo={nombre}
                          cantidad={cantidades[p.id] ?? 0}
                          onCantidadChange={(n) => setCantidadProducto(p.id, n)}
                        />
                      ))}
                    </motion.div>
                  </section>
                ))}
              </div>
            </>
          )}

          {tieneItems && (
            <div className={`${MOBILE_DOCK_SPACER} lg:hidden`} aria-hidden />
          )}
        </div>

        {/* Panel lateral — solo escritorio */}
        <aside className="hidden w-80 shrink-0 lg:sticky lg:top-24 lg:block lg:self-start">
          <motion.div
            variants={fadeUp}
            className="rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface p-5 shadow-glow-cyan"
          >
            <h2 className="font-display mb-4 text-lg font-semibold text-text-primary">
              Resumen del cierre
            </h2>

            <div className="mb-4 max-h-52 space-y-2 overflow-y-auto">
              <ListaResumenItems items={itemsSeleccionados} />
            </div>

            <div className="mb-4 border-t border-bg-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">Total</span>
                <span className="font-display text-2xl font-bold text-accent-cyan tabular-nums">
                  {formatPesos(total)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <Input
                label="Observaciones (opcional)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Turno tarde, lluvia..."
              />
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={guardando || loadingProductos || !tieneItems}
              onClick={abrirRevision}
            >
              Registrar cierre del día
            </Button>
          </motion.div>
        </aside>
      </motion.div>

      {/* Carrito flotante — móvil */}
      <AnimatePresence>
        {tieneItems && !sheetOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
          >
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="focus-ring-cyan pointer-events-auto flex w-full items-center gap-4 rounded-[var(--radius-xl)] border border-accent-cyan/40 bg-bg-elevated p-4 text-left shadow-glow-cyan-strong transition-surface active:scale-[0.99]"
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-cyan text-bg-base">
                <ShoppingBag size={22} aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bg-base px-1 text-[10px] font-bold text-accent-cyan">
                  {totalVasos}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Ver cierre
                </span>
                <span className="font-display text-xl font-bold text-accent-cyan tabular-nums">
                  {formatPesos(total)}
                </span>
              </span>
              <ChevronRight
                size={22}
                className="shrink-0 text-accent-cyan"
                aria-hidden
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CierreBottomSheet
        open={sheetOpen}
        onClose={() => !guardando && setSheetOpen(false)}
        items={itemsSeleccionados}
        total={total}
        totalVasos={totalVasos}
        observaciones={observaciones}
        onObservacionesChange={setObservaciones}
        onCantidadChange={setCantidadProducto}
        onConfirmar={handleConfirmar}
        guardando={guardando}
      />

      {/* Confirmación — escritorio */}
      <Modal
        open={modalOpen}
        onClose={() => !guardando && setModalOpen(false)}
        title="Confirmar cierre del día"
      >
        <div className="space-y-4">
          <ul className="max-h-52 space-y-2 overflow-y-auto text-sm">
            {itemsSeleccionados.map(({ producto, cantidad, subtotal }) => (
              <li
                key={producto.id}
                className="flex justify-between gap-2 text-text-secondary"
              >
                <span className="min-w-0 capitalize">
                  {producto.nombre} {producto.onzas}oz × {cantidad}
                </span>
                <span className="shrink-0 text-accent-cyan tabular-nums">
                  {formatPesos(subtotal)}
                </span>
              </li>
            ))}
          </ul>
          {observaciones.trim() && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Nota:</span>{' '}
              {observaciones.trim()}
            </p>
          )}
          <p className="font-display text-xl font-bold text-accent-cyan tabular-nums">
            Total: {formatPesos(total)}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={guardando}
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={guardando}
              loading={guardando}
              onClick={handleConfirmar}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
