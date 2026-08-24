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
  type VarianteFormDraft,
} from '@/components/productos/ProductoSlideOver'
import { ProductoSwitch } from '@/components/productos/ProductoSwitch'
import { fadeUp } from '@/lib/animations'
import {
  BADGE_TIPO,
  medidaProducto,
  tipoProducto,
} from '@/lib/productos-ui'
import { formatPesos } from '@/lib/utils'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Producto, TipoProducto, VarianteProducto } from '@/types'

type FiltroTipo = 'todos' | TipoProducto

const formVacio = (): ProductoFormState => ({
  nombre: '',
  tipo: 'vaso',
  onzas: '',
  unidad: '',
  precio: '',
  descripcion: '',
  tiene_variantes: false,
  variantes: [],
})

function formDesdeProducto(p: Producto): ProductoFormState {
  const tipo = tipoProducto(p)
  const variantesActivas = (p.variantes ?? []).filter((v) => v.activo)
  return {
    nombre: p.nombre,
    tipo,
    onzas: p.onzas != null ? String(p.onzas) : '',
    unidad: p.unidad ?? '',
    precio: p.precio != null ? String(p.precio) : '',
    descripcion: p.descripcion ?? '',
    tiene_variantes: Boolean(p.tiene_variantes),
    variantes: variantesActivas.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      precio: String(v.precio),
    })),
  }
} 

function buildPayload(form: ProductoFormState) {
  const nombre = form.nombre.trim()
  const descripcion = form.descripcion.trim() || undefined
  const base = { nombre, tipo: form.tipo, descripcion }

  if (form.tipo === 'vaso') {
    return {
      ...base,
      onzas: Number(form.onzas),
      precio: Number(form.precio),
      unidad: null,
      tiene_variantes: false,
    }
  }

  if (form.tipo === 'comida') {
    const tiene = form.tiene_variantes
    return {
      ...base,
      unidad: form.unidad.trim(),
      precio: tiene ? null : Number(form.precio),
      onzas: null,
      tiene_variantes: tiene,
    }
  }

  return {
    ...base,
    unidad: form.unidad.trim(),
    precio: null,
    onzas: null,
    tiene_variantes: false,
  }
}

function validarForm(form: ProductoFormState): string | null {
  if (!form.nombre.trim()) return 'El nombre es requerido'
  if (form.tipo === 'vaso') {
    if (!form.onzas || Number(form.onzas) <= 0) return 'Indica las onzas'
    if (!form.precio || Number(form.precio) < 0 || Number.isNaN(Number(form.precio))) {
      return 'Indica un precio válido'
    }
  }
  if (form.tipo === 'comida') {
    if (!form.unidad.trim()) return 'Indica la unidad'
    if (form.tiene_variantes) {
      if (form.variantes.length === 0) return 'Agrega al menos una variante'
      for (const v of form.variantes) {
        if (!v.nombre.trim()) return 'Cada variante necesita un nombre'
        if (!v.precio || Number(v.precio) < 0 || Number.isNaN(Number(v.precio))) {
          return 'Cada variante necesita un precio válido'
        }
      }
    } else if (
      !form.precio ||
      Number(form.precio) < 0 ||
      Number.isNaN(Number(form.precio))
    ) {
      return 'Indica un precio válido'
    }
  }
  if (form.tipo === 'insumo' && !form.unidad.trim()) {
    return 'Indica la unidad'
  }
  return null
}

async function sincronizarVariantes(
  productoId: string,
  drafts: VarianteFormDraft[],
  existentes: VarianteProducto[] | undefined,
  tieneVariantes: boolean
) {
  const prev = (existentes ?? []).filter((v) => v.activo)

  if (!tieneVariantes) {
    await Promise.all(
      prev.map((v) =>
        fetch(`/api/variantes/${v.id}`, { method: 'DELETE' })
      )
    )
    return
  }

  const keepIds = new Set(drafts.map((d) => d.id).filter(Boolean) as string[])

  await Promise.all(
    prev
      .filter((v) => !keepIds.has(v.id))
      .map((v) => fetch(`/api/variantes/${v.id}`, { method: 'DELETE' }))
  )

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]
    const body = {
      nombre: d.nombre.trim(),
      precio: Number(d.precio),
      orden: i + 1,
      activo: true,
      producto_id: productoId,
    }

    if (d.id) {
      await fetch(`/api/variantes/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: body.nombre,
          precio: body.precio,
          orden: body.orden,
          activo: true,
        }),
      })
    } else {
      await fetch('/api/variantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
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

function BadgeTipo({ tipo }: { tipo: TipoProducto }) {
  const badge = BADGE_TIPO[tipo]
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
        badge.className,
      ].join(' ')}
    >
      {badge.label}
    </span>
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
    <ProductoSwitch
      active={producto.activo}
      onChange={onToggle}
      aria-label={producto.activo ? 'Desactivar producto' : 'Activar producto'}
    />
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
  const tipo = tipoProducto(producto)

  if (tipo === 'insumo') {
    return <span className="text-text-muted tabular-nums">—</span>
  }

  if (producto.tiene_variantes) {
    const activas = (producto.variantes ?? []).filter((v) => v.activo)
    if (activas.length === 0) {
      return <span className="text-xs text-text-muted">Sin variantes</span>
    }
    const precios = activas.map((v) => v.precio)
    const min = Math.min(...precios)
    const max = Math.max(...precios)
    return (
      <span
        className="text-sm font-medium text-text-secondary tabular-nums"
        title={activas.map((v) => `${v.nombre}: ${formatPesos(v.precio)}`).join(' · ')}
      >
        {min === max
          ? formatPesos(min)
          : `${formatPesos(min)} – ${formatPesos(max)}`}
      </span>
    )
  }

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
      {formatPesos(producto.precio ?? 0)}
    </button>
  )
}

export function GestionProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
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
    const error = validarForm(form)
    if (error) {
      toastError(error)
      return
    }

    setGuardando(true)
    const toastId = toastLoading('Guardando producto...')
    const payload = buildPayload(form)

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
      } catch {
        setGuardando(false)
        toastError('Producto guardado, pero falló al sincronizar variantes', toastId)
        cargarProductos()
        return
      }
    }

    setGuardando(false)
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
    if (tipoProducto(p) === 'insumo') return
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

      <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
        <div className="flex w-max min-w-full flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
          {filtrosTipo.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroTipo(f.id)}
              className={
                filtroTipo === f.id
                  ? 'filter-pill filter-pill-active shrink-0'
                  : 'filter-pill filter-pill-inactive shrink-0'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonTabla filas={6} />
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-text-muted">No hay productos que mostrar.</p>
      ) : (
        <>
          {/* Vista móvil: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {filtrados.map((p) => {
              const tipo = tipoProducto(p)
              return (
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
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <BadgeTipo tipo={tipo} />
                          <span className="text-xs text-text-secondary tabular-nums">
                            {medidaProducto(p)}
                          </span>
                        </div>
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
              )
            })}
          </ul>

          {/* Vista escritorio: tabla */}
          <div className="table-surface hidden overflow-x-auto md:block">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Onzas / Unidad</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const tipo = tipoProducto(p)
                  return (
                    <tr key={p.id} className="border-t border-bg-border">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {p.nombre}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeTipo tipo={tipo} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary tabular-nums">
                        {medidaProducto(p)}
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
                  )
                })}
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
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
                onClick={() => desactivarDesdeMenu(productoMenu)}
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
            <div className="my-1 border-t border-bg-border" />
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-bg-elevated"
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
        <p className="mb-6 text-sm text-text-secondary">
          ¿Eliminar permanentemente{' '}
          <span className="font-medium text-text-primary">
            {productoEliminar?.nombre}
            {productoEliminar
              ? ` (${medidaProducto(productoEliminar)})`
              : ''}
          </span>
          ? Esta acción no se puede deshacer. Si el producto ya tiene ventas, no
          se podrá borrar (usa Desactivar en ese caso).
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
