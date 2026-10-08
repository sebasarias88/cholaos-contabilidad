'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmarModal } from '@/components/ui/ConfirmarModal'
import { MenuAccionesPortal, MenuItem, MenuSeparador } from '@/components/ui/MenuAccionesPortal'
import { BotonAcciones } from '@/components/ui/BotonAcciones'
import { useMenuAcciones } from '@/hooks/useMenuAcciones'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { MedioTransferencia } from '@/types'

export function GestionMediosTransferencia() {
  const [medios, setMedios] = useState<MedioTransferencia[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<MedioTransferencia | null>(null)
  const [nombre, setNombre] = useState('')
  const menu = useMenuAcciones()
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(() => {
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

  function abrirNuevo() {
    setEditando(null)
    setNombre('')
    setModalOpen(true)
  }

  function abrirEditar(m: MedioTransferencia) {
    menu.close()
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
      editando ? `/api/medios-transferencia/${editando.id}` : '/api/medios-transferencia',
      {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: valor }),
      }
    )

    setGuardando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError((data as { error?: string }).error ?? 'Error al guardar', toastId)
      return
    }

    toastSuccess(editando ? 'Medio actualizado' : 'Medio creado', toastId)
    cerrarModal()
    cargar()
  }

  async function cambiarActivo(m: MedioTransferencia, activo: boolean) {
    menu.close()
    const toastId = toastLoading(activo ? 'Activando...' : 'Desactivando...')

    const res = await fetch(`/api/medios-transferencia/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError((data as { error?: string }).error ?? 'Error al actualizar', toastId)
      return
    }

    toastSuccess(activo ? 'Medio activado' : 'Medio desactivado', toastId)
    cargar()
  }

  function pedirEliminar(m: MedioTransferencia) {
    menu.close()
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
      toastError((data as { error?: string }).error ?? 'Error al eliminar', toastId)
      return
    }

    toastSuccess('Medio eliminado', toastId)
    setEliminarId(null)
    cargar()
  }

  const activos = medios.filter((m) => m.activo)
  const inactivos = medios.filter((m) => !m.activo)
  const medioMenu = medios.find((m) => m.id === menu.menuId)
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
        <span className="text-text-primary min-w-0 text-sm font-medium capitalize">{m.nombre}</span>
        <BotonAcciones abierto={menu.isOpen(m.id)} onClick={(e) => menu.toggle(m.id, e)} />
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
          <h2 className="font-display text-text-primary text-lg">Medios de transferencia</h2>
          <p className="text-text-secondary mt-1 text-sm">
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
            className="divide-bg-border border-bg-border bg-bg-surface divide-y overflow-hidden rounded-[var(--radius-lg)] border"
          >
            {activos.length === 0 ? (
              <li className="text-text-muted px-4 py-8 text-center text-sm">
                No hay medios activos. Agrega al menos uno para el cierre.
              </li>
            ) : (
              activos.map((m) => filaMedio(m))
            )}
          </motion.ul>

          {inactivos.length > 0 && (
            <motion.div variants={fadeUp} className="space-y-2">
              <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                Inactivos
              </p>
              <ul className="divide-bg-border border-bg-border bg-bg-elevated/30 divide-y overflow-hidden rounded-[var(--radius-lg)] border">
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

      <MenuAccionesPortal open={!!medioMenu} position={menu.menuPos} menuRef={menu.menuRef}>
        {medioMenu && (
          <>
            <MenuItem onClick={() => abrirEditar(medioMenu)}>Editar nombre</MenuItem>
            <MenuItem onClick={() => cambiarActivo(medioMenu, !medioMenu.activo)}>
              {medioMenu.activo ? 'Desactivar' : 'Activar'}
            </MenuItem>
            <MenuSeparador />
            <MenuItem tono="peligro" onClick={() => pedirEliminar(medioMenu)}>
              Eliminar
            </MenuItem>
          </>
        )}
      </MenuAccionesPortal>

      <ConfirmarModal
        open={eliminarId !== null}
        titulo="Eliminar medio de transferencia"
        cargando={eliminando}
        onCancelar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
      >
        ¿Eliminar permanentemente{' '}
        <span className="text-text-primary font-medium capitalize">{medioEliminar?.nombre}</span>?
        Esta acción no se puede deshacer. Si el medio ya aparece en cierres, no se podrá borrar (usa
        Desactivar en ese caso).
      </ConfirmarModal>
    </motion.div>
  )
}
