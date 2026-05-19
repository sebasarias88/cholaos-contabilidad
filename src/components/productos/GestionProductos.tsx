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
      className="flex flex-col gap-6"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
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
            className="select-field select-field--with-icon w-full"
          />
        </div>
        <Button type="button" onClick={abrirNuevo} className="shrink-0">
          <Plus size={18} className="mr-2" aria-hidden />
          Nuevo producto
        </Button>
      </div>

      {opcionesOnzas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {opcionesOnzas.map((oz) => (
            <button
              key={String(oz)}
              type="button"
              onClick={() => setFiltroOnzas(oz)}
              className={
                filtroOnzas === oz
                  ? 'filter-pill filter-pill-active'
                  : 'filter-pill filter-pill-inactive'
              }
            >
              {oz === 'todos' ? 'Todos' : `${oz}oz`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonTabla filas={6} />
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-text-muted">No hay productos que mostrar.</p>
      ) : (
        <div className="table-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
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
                  <td className="px-4 py-3 text-text-secondary">{p.onzas} oz</td>
                  <td className="px-4 py-3">
                    {editingPrecioId === p.id ? (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        autoFocus
                        value={precioDraft}
                        onChange={(e) => setPrecioDraft(e.target.value)}
                        onBlur={() => guardarPrecioInline(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            guardarPrecioInline(p.id)
                          }
                          if (e.key === 'Escape') setEditingPrecioId(null)
                        }}
                        className="select-field w-28 tabular-nums"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPrecioId(p.id)
                          setPrecioDraft(String(p.precio))
                        }}
                        className="font-medium text-accent-cyan underline-offset-2 hover:underline"
                        title="Click para editar precio"
                      >
                        {formatPesos(p.precio)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductoSwitch
                        active={p.activo}
                        onChange={() => toggleActivo(p)}
                      />
                      <span
                        className={
                          p.activo ? 'badge-green' : 'text-xs text-text-muted'
                        }
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      data-menu-accion
                      aria-label="Acciones del producto"
                      aria-expanded={isOpen(p.id)}
                      onClick={(e) => toggle(p.id, e)}
                      className="focus-ring-cyan rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
