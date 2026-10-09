'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { PildorasFiltro } from '@/components/ui/PildorasFiltro'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MenuAccionesPortal } from '@/components/ui/MenuAccionesPortal'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { useMenuAcciones } from '@/hooks/useMenuAcciones'
import { ProductoSlideOver } from '@/components/productos/ProductoSlideOver'
import type { ProductoFormState } from '@/lib/productos/formulario'
import { fadeUp } from '@/lib/animations'
import { esSoloConteo, medidaProducto, tipoProducto } from '@/lib/productos-ui'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Producto, TallaVaso, TipoProducto } from '@/types'
import { ProductosLista } from '@/components/productos/ProductosLista'
import {
  construirPayloadProducto,
  formDesdeProducto,
  formVacio,
  validarFormProducto,
} from '@/lib/productos/formulario'
import { sincronizarVariantes } from '@/lib/productos/variantes-api'

type FiltroTipo = 'todos' | TipoProducto

export function GestionProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [tallas, setTallas] = useState<TallaVaso[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')

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
    fetch('/api/productos?todos=true')
      .then((r) => r.json())
      .then((data: Producto[]) => setProductos(data))
      .catch(() => toast.error('Error cargando productos'))
      .finally(() => setLoading(false))
  }, [])

  const cargarTallas = useCallback(() => {
    fetch('/api/tallas-vasos?todas=1')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: TallaVaso[]) => setTallas(Array.isArray(data) ? data : []))
      .catch(() => {
        /* opcional: el panel de vaso puede crear tallas nuevas */
      })
  }, [])

  useEffect(() => {
    cargarProductos()
    cargarTallas()
  }, [cargarProductos, cargarTallas])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      const tipo = tipoProducto(p)
      if (filtroTipo !== 'todos' && tipo !== filtroTipo) return false
      if (!q) return true
      return p.nombre.toLowerCase().includes(q)
    })
  }, [productos, busqueda, filtroTipo])

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
    const error = validarFormProducto(form)
    if (error) {
      toastError(error)
      return
    }

    setGuardando(true)
    const toastId = toastLoading('Guardando producto...')
    const payload = construirPayloadProducto(form)

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

    if (!res.ok) {
      setGuardando(false)
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      toastError(data.error ?? 'Error al guardar. Intenta de nuevo.', toastId)
      return
    }

    const guardado = (await res.json()) as Producto

    if (form.tipo === 'comida') {
      try {
        await sincronizarVariantes(
          guardado.id,
          form.variantes,
          editando?.variantes,
          form.tiene_variantes
        )
      } catch (err) {
        setGuardando(false)
        toastError(
          `Producto guardado, pero falló al guardar variantes: ${(err as Error).message}`,
          toastId
        )
        cargarProductos()
        return
      }
    }

    setGuardando(false)
    toastSuccess(editando ? 'Producto actualizado' : 'Producto creado', toastId)
    cerrarPanel()
    cargarProductos()
    cargarTallas()
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
    if (esSoloConteo(tipoProducto(p))) return
    if (p.tiene_variantes) return
    setEditingPrecioId(p.id)
    setPrecioDraft(String(p.precio ?? 0))
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
    const toastId = toastLoading('Eliminando producto...')
    const res = await fetch(`/api/productos/${eliminarId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))

    setEliminando(false)

    if (!res.ok) {
      toastError(data.error ?? 'Error al eliminar. Intenta de nuevo.', toastId)
      return
    }

    toastSuccess('Producto eliminado', toastId)
    setEliminarId(null)
    cargarProductos()
  }

  const productoEliminar = productos.find((p) => p.id === eliminarId)
  const productoMenu = filtrados.find((p) => p.id === menuId)

  function pedirEliminar(p: Producto) {
    close()
    setEliminarId(p.id)
  }

  function editarDesdeMenu(p: Producto) {
    close()
    abrirEditar(p)
  }

  async function desactivarDesdeMenu(p: Producto) {
    close()
    await toggleActivo(p)
  }

  async function activarDesdeMenu(p: Producto) {
    close()
    await toggleActivo(p)
  }

  const filtrosTipo: { id: FiltroTipo; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'vaso', label: '🥤 Vasos' },
    { id: 'comida', label: '🍕 Comida' },
    { id: 'insumo', label: '🧂 Insumos' },
    { id: 'masa', label: '🥣 Masas' },
  ]

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
            className="text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
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
        <Button type="button" onClick={abrirNuevo} className="w-full shrink-0 sm:w-auto">
          <Plus size={18} aria-hidden />
          Nuevo producto
        </Button>
      </div>

      <PildorasFiltro
        opciones={filtrosTipo}
        valor={filtroTipo}
        onChange={setFiltroTipo}
        id="productos"
        etiqueta="Tipo de producto"
      />

      {loading ? (
        <SkeletonTabla filas={6} />
      ) : filtrados.length === 0 ? (
        <EstadoVacio
          icono={<Package size={26} aria-hidden />}
          titulo="No hay productos que mostrar"
          descripcion={
            busqueda ? 'Prueba con otro nombre.' : 'Crea uno con el botón Nuevo producto.'
          }
        />
      ) : (
        <>
          <ProductosLista
            productos={filtrados}
            precio={{
              editandoId: editingPrecioId,
              borrador: precioDraft,
              iniciar: iniciarEdicionPrecio,
              cambiar: setPrecioDraft,
              guardar: guardarPrecioInline,
              cancelar: () => setEditingPrecioId(null),
            }}
            menuAbierto={isOpen}
            onToggleMenu={toggle}
            onToggleActivo={toggleActivo}
          />
        </>
      )}

      <MenuAccionesPortal open={!!productoMenu} position={menuPos} menuRef={menuRef}>
        {productoMenu && (
          <>
            <button
              type="button"
              role="menuitem"
              className="text-text-primary hover:bg-bg-elevated w-full px-3 py-2 text-left text-sm"
              onClick={() => editarDesdeMenu(productoMenu)}
            >
              Editar
            </button>
            {productoMenu.activo ? (
              <button
                type="button"
                role="menuitem"
                className="text-text-primary hover:bg-bg-elevated w-full px-3 py-2 text-left text-sm"
                onClick={() => desactivarDesdeMenu(productoMenu)}
              >
                Desactivar
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="text-ok hover:bg-bg-elevated w-full px-3 py-2 text-left text-sm"
                onClick={() => activarDesdeMenu(productoMenu)}
              >
                Activar
              </button>
            )}
            <div className="border-bg-border my-1 border-t" />
            <button
              type="button"
              role="menuitem"
              className="text-bad hover:bg-bg-elevated w-full px-3 py-2 text-left text-sm"
              onClick={() => pedirEliminar(productoMenu)}
            >
              Eliminar
            </button>
          </>
        )}
      </MenuAccionesPortal>

      <ProductoSlideOver
        open={panelOpen}
        producto={editando}
        form={form}
        tallas={tallas}
        guardando={guardando}
        onClose={cerrarPanel}
        onChange={setForm}
        onSubmit={handleSubmitForm}
      />

      <Modal
        open={eliminarId !== null}
        onClose={() => !eliminando && setEliminarId(null)}
        title="Eliminar producto"
      >
        <p className="text-text-secondary mb-6 text-sm">
          ¿Eliminar permanentemente{' '}
          <span className="text-text-primary font-medium">
            {productoEliminar?.nombre}
            {productoEliminar ? ` (${medidaProducto(productoEliminar)})` : ''}
          </span>
          ? Esta acción no se puede deshacer. Si el producto ya tiene ventas, no se podrá borrar
          (usa Desactivar en ese caso).
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
            loading={eliminando}
            disabled={eliminando}
            onClick={confirmarEliminar}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </motion.div>
  )
}
