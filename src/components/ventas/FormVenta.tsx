'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { formatPesos } from '@/lib/utils'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Producto } from '@/types'

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

export function FormVenta() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [busqueda, setBusqueda] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
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

  const itemsSeleccionados = useMemo(() => {
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

  function setCantidad(productoId: string, raw: string) {
    const n = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)) || 0)
    setCantidades((prev) => ({ ...prev, [productoId]: n }))
  }

  function limpiarFormulario() {
    setCantidades({})
    setObservaciones('')
    setBusqueda('')
    setModalOpen(false)
  }

  function handleRegistrarClick() {
    if (itemsSeleccionados.length === 0) {
      toastError('Agrega al menos un producto con cantidad mayor a 0')
      return
    }
    setModalOpen(true)
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-6">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="select-field pl-10"
            />
          </div>
        </motion.div>

        {loadingProductos ? (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Skeleton className="h-36 w-full" />
              </motion.div>
            ))}
          </motion.div>
        ) : grupos.length === 0 ? (
          <p className="text-sm text-text-muted">
            {busqueda
              ? 'No hay productos que coincidan con la búsqueda.'
              : 'No hay productos activos en el catálogo.'}
          </p>
        ) : (
          grupos.map(([nombre, variantes]) => (
            <motion.section
              key={nombre}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <h2 className="font-display text-lg font-semibold capitalize text-text-primary">
                {nombre}
              </h2>
              <motion.div
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                variants={staggerContainer}
              >
                {variantes.map((p) => {
                  const cantidad = cantidades[p.id] ?? 0
                  const subtotal = cantidad * p.precio
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      variants={fadeUp}
                      className={[
                        'rounded-[var(--radius-lg)] border bg-bg-surface p-4 transition-surface',
                        cantidad > 0
                          ? 'border-accent-cyan/40 shadow-glow-cyan'
                          : 'border-bg-border',
                      ].join(' ')}
                    >
                      <motion.div layout className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-text-primary">{p.onzas} oz</p>
                          <p className="text-sm text-text-secondary">
                            {formatPesos(p.precio)} / vaso
                          </p>
                        </div>
                        {cantidad > 0 && (
                          <span className="badge-cyan shrink-0">
                            {formatPesos(subtotal)}
                          </span>
                        )}
                      </motion.div>
                      <label className="sr-only" htmlFor={`qty-${p.id}`}>
                        Cantidad {nombre} {p.onzas} oz
                      </label>
                      <input
                        id={`qty-${p.id}`}
                        type="number"
                        min={0}
                        step={1}
                        value={cantidad === 0 ? '' : cantidad}
                        placeholder="0"
                        onChange={(e) => setCantidad(p.id, e.target.value)}
                        className="select-field text-center text-lg font-semibold tabular-nums"
                      />
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.section>
          ))
        )}
      </div>

      <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface p-5 shadow-glow-cyan"
        >
          <h2 className="font-display mb-4 text-lg font-semibold text-text-primary">
            Resumen del cierre
          </h2>

          <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
            {itemsSeleccionados.length === 0 ? (
              <p className="text-sm text-text-muted">
                Agrega cantidades en el catálogo.
              </p>
            ) : (
              itemsSeleccionados.map(({ producto, cantidad, subtotal }) => (
                <motion.div
                  key={producto.id}
                  layout
                  className="flex justify-between gap-2 text-sm"
                >
                  <span className="text-text-secondary">
                    {producto.nombre} {producto.onzas}oz × {cantidad}
                  </span>
                  <span className="shrink-0 font-medium text-accent-cyan">
                    {formatPesos(subtotal)}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          <motion.div layout className="mb-4 border-t border-bg-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Total</span>
              <span className="font-display text-2xl font-bold text-accent-cyan">
                {formatPesos(total)}
              </span>
            </div>
          </motion.div>

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
            disabled={guardando || loadingProductos}
            onClick={handleRegistrarClick}
          >
            Registrar cierre del día
          </Button>
        </motion.div>
      </aside>

      <Modal
        open={modalOpen}
        onClose={() => !guardando && setModalOpen(false)}
        title="Confirmar cierre del día"
      >
        <div className="space-y-4">
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {itemsSeleccionados.map(({ producto, cantidad, subtotal }) => (
              <li
                key={producto.id}
                className="flex justify-between gap-2 text-text-secondary"
              >
                <span>
                  {producto.nombre} {producto.onzas}oz × {cantidad}
                </span>
                <span className="text-accent-cyan">{formatPesos(subtotal)}</span>
              </li>
            ))}
          </ul>
          {observaciones.trim() && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Nota:</span>{' '}
              {observaciones.trim()}
            </p>
          )}
          <p className="font-display text-xl font-bold text-accent-cyan">
            Total: {formatPesos(total)}
          </p>
          <motion.div layout className="flex gap-3">
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
              onClick={handleConfirmar}
            >
              {guardando ? 'Guardando...' : 'Confirmar'}
            </Button>
          </motion.div>
        </div>
      </Modal>
    </div>
  )
}
