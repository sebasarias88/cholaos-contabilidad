'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { MedioTransferencia } from '@/types'

function BotonMenu({
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
      aria-label="Acciones"
      aria-expanded={abierto}
      onClick={onClick}
      className="focus-ring-cyan inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
    >
      <MoreHorizontal size={18} />
    </button>
  )
}

export function GestionMediosTransferencia() {
  const [medios, setMedios] = useState<MedioTransferencia[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<MedioTransferencia | null>(null)
  const [nombre, setNombre] = useState('')
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  )
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/medios-transferencia?todas=1')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: MedioTransferencia[]) => {
        const lista = Array.isArray(data) ? data : []
        setMedios(lista.sort((a, b) => a.orden - b.orden))
      })
      .catch(() => toastError('Error cargando medios de transferencia'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!menuAbierto) return

    function cerrarMenu() {
      setMenuAbierto(null)
      setMenuPos(null)
    }

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if ((target as Element).closest?.('[data-menu-accion]')) return
      cerrarMenu()
    }

    function onScroll() {
      cerrarMenu()
    }

    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [menuAbierto])

  function toggleMenu(m: MedioTransferencia, e: React.MouseEvent<HTMLButtonElement>) {
    if (menuAbierto === m.id) {
      setMenuAbierto(null)
      setMenuPos(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right })
    setMenuAbierto(m.id)
  }

  function abrirNuevo() {
    setEditando(null)
    setNombre('')
    setModalOpen(true)
  }

  function abrirEditar(m: MedioTransferencia) {
    setMenuAbierto(null)
    setMenuPos(null)
    setEditando(m)
    setNombre(m.nombre)
    setModalOpen(true)
  }

  function cerrarModal() {
    setModalOpen(false)
    setEditando(null)
    setNombre('')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const valor = nombre.trim()
    if (!valor) {
      toastError('Ingresa el nombre del medio')
      return
    }

    setGuardando(true)
    const toastId = toastLoading(editando ? 'Guardando cambios...' : 'Creando medio...')

    const res = await fetch(
      editando
        ? `/api/medios-transferencia/${editando.id}`
        : '/api/medios-transferencia',
      {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: valor }),
      }
    )

    setGuardando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError(
        (data as { error?: string }).error ?? 'Error al guardar',
        toastId
      )
      return
    }

    toastSuccess(editando ? 'Medio actualizado' : 'Medio creado', toastId)
    cerrarModal()
    cargar()
  }

  async function cambiarActivo(m: MedioTransferencia, activo: boolean) {
    setMenuAbierto(null)
    setMenuPos(null)
    const toastId = toastLoading(activo ? 'Activando...' : 'Desactivando...')

    const res = await fetch(`/api/medios-transferencia/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError(
        (data as { error?: string }).error ?? 'Error al actualizar',
        toastId
      )
      return
    }

    toastSuccess(activo ? 'Medio activado' : 'Medio desactivado', toastId)
    cargar()
  }

  function pedirEliminar(m: MedioTransferencia) {
    setMenuAbierto(null)
    setMenuPos(null)
    setEliminarId(m.id)
  }

  async function confirmarEliminar() {
    if (!eliminarId) return
    setEliminando(true)
    const toastId = toastLoading('Eliminando medio...')

    const res = await fetch(`/api/medios-transferencia/${eliminarId}`, {
      method: 'DELETE',
    })

    setEliminando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError(
        (data as { error?: string }).error ?? 'Error al eliminar',
        toastId
      )
      return
    }

    toastSuccess('Medio eliminado', toastId)
    setEliminarId(null)
    cargar()
  }

  const activos = medios.filter((m) => m.activo)
  const inactivos = medios.filter((m) => !m.activo)
  const medioMenu = medios.find((m) => m.id === menuAbierto)
  const medioEliminar = medios.find((m) => m.id === eliminarId)

  function filaMedio(m: MedioTransferencia, atenuado = false) {
    return (
      <li
        key={m.id}
        className={[
          'flex items-center justify-between gap-3 px-4 py-3',
          atenuado ? 'opacity-70' : '',
        ].join(' ')}
      >
        <span className="min-w-0 text-sm font-medium capitalize text-text-primary">
          {m.nombre}
        </span>
        <BotonMenu
          abierto={menuAbierto === m.id}
          onClick={(e) => toggleMenu(m, e)}
        />
      </li>
    )
  }

  return (
    <motion.div variants={fadeUp} className="space-y-4">
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="font-display text-lg text-text-primary">
            Medios de transferencia
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Opciones del select en el cierre del día (Nequi, Daviplata, etc.).
          </p>
        </div>
        <Button type="button" size="sm" onClick={abrirNuevo} className="shrink-0">
          <Plus size={16} aria-hidden />
          Agregar
        </Button>
      </motion.div>

      {loading ? (
        <motion.div variants={fadeUp} className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[var(--radius-lg)]" />
          ))}
        </motion.div>
      ) : (
        <>
          <motion.ul
            variants={fadeUp}
            className="divide-y divide-bg-border overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface"
          >
            {activos.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-muted">
                No hay medios activos. Agrega al menos uno para el cierre.
              </li>
            ) : (
              activos.map((m) => filaMedio(m))
            )}
          </motion.ul>

          {inactivos.length > 0 && (
            <motion.div variants={fadeUp} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Inactivos
              </p>
              <ul className="divide-y divide-bg-border overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-elevated/30">
                {inactivos.map((m) => filaMedio(m, true))}
              </ul>
            </motion.div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? 'Editar medio' : 'Nuevo medio de transferencia'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Nequi"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {editando ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {medioMenu &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] min-w-[10rem] rounded-[var(--radius-md)] border border-bg-border bg-bg-surface py-1 shadow-lg"
            style={{
              top: menuPos.top,
              left: Math.max(8, menuPos.left - 140),
            }}
          >
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
              onClick={() => abrirEditar(medioMenu)}
            >
              Editar nombre
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
              onClick={() => cambiarActivo(medioMenu, !medioMenu.activo)}
            >
              {medioMenu.activo ? 'Desactivar' : 'Activar'}
            </button>
            <div className="my-1 border-t border-bg-border" />
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-accent-red-dim"
              onClick={() => pedirEliminar(medioMenu)}
            >
              Eliminar
            </button>
          </div>,
          document.body
        )}

      <Modal
        open={eliminarId !== null}
        onClose={() => !eliminando && setEliminarId(null)}
        title="Eliminar medio de transferencia"
      >
        <p className="mb-6 text-sm text-text-secondary">
          ¿Eliminar permanentemente{' '}
          <span className="font-medium capitalize text-text-primary">
            {medioEliminar?.nombre}
          </span>
          ? Esta acción no se puede deshacer. Si el medio ya aparece en cierres,
          no se podrá borrar (usa Desactivar en ese caso).
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
