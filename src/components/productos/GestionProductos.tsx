'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MenuAccionesPortal } from '@/components/ui/MenuAccionesPortal'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { useMenuAcciones } from '@/hooks/useMenuAcciones'
import {
  ProductoSlideOver,
  type ProductoFormState,
} from '@/components/productos/ProductoSlideOver'
import { ProductoSwitch } from '@/components/productos/ProductoSwitch'
import { fadeUp } from '@/lib/animations'
import { formatPesos } from '@/lib/utils'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Producto } from '@/types'

type FiltroOnzas = 'todos' | number

const formVacio = (): ProductoFormState => ({
  nombre: '',
  onzas: 12,
  precio: '',
  descripcion: '',
})

function formDesdeProducto(p: Producto): ProductoFormState {
  return {
    nombre: p.nombre,
    onzas: p.onzas,
    precio: String(p.precio),
    descripcion: p.descripcion ?? '',
  }
}

function BotonMenuProducto({
  abierto,
  onClick,
}: {
  abierto: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      data-menu-accion
      aria-label="Acciones del producto"
      aria-expanded={abierto}
      onClick={onClick}
      className="focus-ring-cyan inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
    >
      <MoreHorizontal size={20} />
    </button>
  )
}

function ProductoEstado({
  producto,
  onToggle,
}: {
  producto: Producto
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <ProductoSwitch active={producto.activo} onChange={onToggle} />
      <span
        className={
          producto.activo ? 'badge-green shrink-0' : 'shrink-0 text-xs text-text-muted'
        }
      >
        {producto.activo ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  )
}

function ProductoPrecio({
  producto,
  editingPrecioId,
  precioDraft,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  inputClassName = 'select-field w-28 tabular-nums',
}: {
  producto: Producto
  editingPrecioId: string | null
  precioDraft: string
  onStartEdit: () => void
  onDraftChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  inputClassName?: string
}) {
  if (editingPrecioId === producto.id) {
    return (
      <input
        type="number"
        min={0}
        step={1}
        autoFocus
        value={precioDraft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSave()
          }
          if (e.key === 'Escape') onCancel()
        }}
        className={inputClassName}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      className="font-medium text-accent-cyan underline-offset-2 hover:underline tabular-nums"
      title="Click para editar precio"
    >
      {formatPesos(producto.precio)}
    </button>
  )
}

export function GestionProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroOnzas, setFiltroOnzas] = useState<FiltroOnzas>('todos')

  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState<ProductoFormState>(formVacio())
  const [guardando, setGuardando] = useState(false)

  const [editingPrecioId, setEditingPrecioId] = useState<string | null>(null)
  const [precioDraft, setPrecioDraft] = useState('')

  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const { menuId, menuPos, menuRef, toggle, close, isOpen } = useMenuAcciones()

  const cargarProductos = useCallback(() => {
    setLoading(true)
    fetch('/api/productos?todos=true')
      .then((r) => r.json())
      .then((data: Producto[]) => setProductos(data))
      .catch(() => toast.error('Error cargando productos'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargarProductos()
  }, [cargarProductos])

  const onzasDisponibles = useMemo(() => {
    const unicas = new Set(productos.map((p) => Number(p.onzas)))
    return Array.from(unicas).sort((a, b) => a - b)
  }, [productos])

  const opcionesOnzas = useMemo(
    (): FiltroOnzas[] => ['todos', ...onzasDisponibles],
    [onzasDisponibles]
  )

  useEffect(() => {
    if (filtroOnzas !== 'todos' && !onzasDisponibles.includes(filtroOnzas)) {
      setFiltroOnzas('todos')
    }
  }, [onzasDisponibles, filtroOnzas])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (filtroOnzas !== 'todos' && p.onzas !== filtroOnzas) return false
      if (!q) return true
      return p.nombre.toLowerCase().includes(q)
    })
  }, [productos, busqueda, filtroOnzas])

  function abrirNuevo() {
    setEditando(null)
    setForm(formVacio())
    setPanelOpen(true)
  }

  function abrirEditar(p: Producto) {
    setEditando(p)
    setForm(formDesdeProducto(p))
    setPanelOpen(true)
  }

  function cerrarPanel() {
    if (guardando) return
    setPanelOpen(false)
    setEditando(null)
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    const toastId = toastLoading('Guardando producto...')
    const payload = {
      nombre: form.nombre.trim(),
      onzas: form.onzas,
      precio: Number(form.precio),
      descripcion: form.descripcion.trim() || undefined,
    }

    const res = editando
      ? await fetch(`/api/productos/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    setGuardando(false)

    if (!res.ok) {
      toastError('Error al guardar. Intenta de nuevo.', toastId)
      return
    }

    toastSuccess(
      editando ? 'Producto actualizado' : 'Producto creado',
      toastId
    )
    cerrarPanel()
    cargarProductos()
  }

  async function guardarPrecioInline(id: string) {
    const precio = Number(precioDraft)
    if (!precioDraft || precio < 0 || Number.isNaN(precio)) {
      setEditingPrecioId(null)
      return
    }

    const toastId = toastLoading('Actualizando precio...')
    const res = await fetch(`/api/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precio }),
    })

    if (!res.ok) {
      toastError('Error al guardar. Intenta de nuevo.', toastId)
      return
    }

    toastSuccess('Precio actualizado', toastId)
    setEditingPrecioId(null)
    cargarProductos()
  }

  function iniciarEdicionPrecio(p: Producto) {
    setEditingPrecioId(p.id)
    setPrecioDraft(String(p.precio))
  }

  async function toggleActivo(p: Producto) {
    const toastId = toastLoading('Actualizando estado...')
    const res = await fetch(`/api/productos/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !p.activo }),
    })

    if (!res.ok) {
      toastError('Error al guardar. Intenta de nuevo.', toastId)
      return
    }

    toastSuccess(p.activo ? 'Producto desactivado' : 'Producto activado', toastId)
    cargarProductos()
  }

  async function confirmarEliminar() {
    if (!eliminarId) return
    setEliminando(true)
    const toastId = toastLoading('Desactivando producto...')
    const res = await fetch(`/api/productos/${eliminarId}`, { method: 'DELETE' })

    setEliminando(false)

    if (!res.ok) {
      toastError('Error al eliminar. Intenta de nuevo.', toastId)
      return
    }

    toastSuccess('Producto desactivado', toastId)
    setEliminarId(null)
    cargarProductos()
  }

  const productoEliminar = productos.find((p) => p.id === eliminarId)
  const productoMenu = filtrados.find((p) => p.id === menuId)

  function abrirDesdeMenu(p: Producto) {
    close()
    setEliminarId(p.id)
  }

  function editarDesdeMenu(p: Producto) {
    close()
    abrirEditar(p)
  }

  async function activarDesdeMenu(p: Producto) {
    close()
    await toggleActivo(p)
  }

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-5 sm:gap-6"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="select-field select-field--with-icon w-full min-w-0"
          />
        </div>
        <Button
          type="button"
          onClick={abrirNuevo}
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus size={18} className="mr-2" aria-hidden />
          Nuevo producto
        </Button>
      </div>

      {opcionesOnzas.length > 1 && (
        <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
          <div className="flex w-max min-w-full flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
            {opcionesOnzas.map((oz) => (
              <button
                key={String(oz)}
                type="button"
                onClick={() => setFiltroOnzas(oz)}
                className={
                  filtroOnzas === oz
                    ? 'filter-pill filter-pill-active shrink-0'
                    : 'filter-pill filter-pill-inactive shrink-0'
                }
              >
                {oz === 'todos' ? 'Todos' : `${oz}oz`}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTabla filas={6} />
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-text-muted">No hay productos que mostrar.</p>
      ) : (
        <>
          {/* Vista móvil: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {filtrados.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface"
              >
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-text-primary">
                        {p.nombre}
                      </p>
                      <span className="badge-cyan mt-1.5 inline-block tabular-nums">
                        {p.onzas} oz
                      </span>
                    </div>
                    <BotonMenuProducto
                      abierto={isOpen(p.id)}
                      onClick={(e) => toggle(p.id, e)}
                    />
                  </div>

                  <div className="mt-4 space-y-3 border-t border-bg-border pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-text-muted">Precio</span>
                      <ProductoPrecio
                        producto={p}
                        editingPrecioId={editingPrecioId}
                        precioDraft={precioDraft}
                        onStartEdit={() => iniciarEdicionPrecio(p)}
                        onDraftChange={setPrecioDraft}
                        onSave={() => guardarPrecioInline(p.id)}
                        onCancel={() => setEditingPrecioId(null)}
                        inputClassName="select-field w-full max-w-[10rem] tabular-nums sm:max-w-none sm:w-28"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-text-muted">Estado</span>
                      <ProductoEstado
                        producto={p}
                        onToggle={() => toggleActivo(p)}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Vista escritorio: tabla */}
          <div className="table-surface hidden overflow-x-auto md:block">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Onzas</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-t border-bg-border">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {p.nombre}
                    </td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {p.onzas} oz
                    </td>
                    <td className="px-4 py-3">
                      <ProductoPrecio
                        producto={p}
                        editingPrecioId={editingPrecioId}
                        precioDraft={precioDraft}
                        onStartEdit={() => iniciarEdicionPrecio(p)}
                        onDraftChange={setPrecioDraft}
                        onSave={() => guardarPrecioInline(p.id)}
                        onCancel={() => setEditingPrecioId(null)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ProductoEstado
                        producto={p}
                        onToggle={() => toggleActivo(p)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BotonMenuProducto
                        abierto={isOpen(p.id)}
                        onClick={(e) => toggle(p.id, e)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <MenuAccionesPortal
        open={!!productoMenu}
        position={menuPos}
        menuRef={menuRef}
      >
        {productoMenu && (
          <>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
              onClick={() => editarDesdeMenu(productoMenu)}
            >
              Editar
            </button>
            {productoMenu.activo ? (
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-bg-elevated"
                onClick={() => abrirDesdeMenu(productoMenu)}
              >
                Desactivar
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 text-left text-sm text-accent-green hover:bg-bg-elevated"
                onClick={() => activarDesdeMenu(productoMenu)}
              >
                Activar
              </button>
            )}
          </>
        )}
      </MenuAccionesPortal>

      <ProductoSlideOver
        open={panelOpen}
        producto={editando}
        form={form}
        guardando={guardando}
        onClose={cerrarPanel}
        onChange={setForm}
        onSubmit={handleSubmitForm}
      />

      <Modal
        open={eliminarId !== null}
        onClose={() => !eliminando && setEliminarId(null)}
        title="Desactivar producto"
      >
        <p className="mb-6 text-sm text-text-secondary">
          ¿Desactivar{' '}
          <span className="font-medium text-text-primary">
            {productoEliminar?.nombre} ({productoEliminar?.onzas} oz)
          </span>
          ? No se borrará del sistema; dejará de aparecer en ventas.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={eliminando}
            onClick={() => setEliminarId(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            disabled={eliminando}
            onClick={confirmarEliminar}
          >
            {eliminando ? 'Eliminando...' : 'Desactivar'}
          </Button>
        </div>
      </Modal>
    </motion.div>
  )
}
