'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MenuAccionesPortal, MenuItem } from '@/components/ui/MenuAccionesPortal'
import { BotonAcciones } from '@/components/ui/BotonAcciones'
import { useMenuAcciones } from '@/hooks/useMenuAcciones'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { esMotivoPredefinido } from '@/lib/motivos-novedad'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { MotivoNovedad } from '@/types'

type MotivoForm = {
  descripcion: string
  emoji: string
}

const FORM_VACIO: MotivoForm = { descripcion: '', emoji: '⚪' }

export function GestionMotivosNovedad() {
  const [motivos, setMotivos] = useState<MotivoNovedad[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<MotivoNovedad | null>(null)
  const [form, setForm] = useState<MotivoForm>(FORM_VACIO)
  const menu = useMenuAcciones()

  const cargar = useCallback(() => {
    fetch('/api/motivos-novedad?todas=1')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: MotivoNovedad[]) => {
        const lista = Array.isArray(data) ? data : []
        setMotivos(lista.sort((a, b) => a.orden - b.orden))
      })
      .catch(() => toastError('Error cargando motivos de novedad'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function abrirNuevo() {
    setEditando(null)
    setForm(FORM_VACIO)
    setModalOpen(true)
  }

  function abrirEditar(m: MotivoNovedad) {
    menu.close()
    setEditando(m)
    setForm({
      descripcion: m.descripcion,
      emoji: m.emoji,
    })
    setModalOpen(true)
  }

  function cerrarModal() {
    setModalOpen(false)
    setEditando(null)
    setForm(FORM_VACIO)
  }

  async function guardarMotivo(e: React.FormEvent) {
    e.preventDefault()
    const descripcion = form.descripcion.trim()
    const emoji = form.emoji.trim()

    if (!emoji) {
      toastError('Ingresa un emoji')
      return
    }

    const esPredefinido = editando ? esMotivoPredefinido(editando) : false
    if (!esPredefinido && !descripcion) {
      toastError('Ingresa la descripción del motivo')
      return
    }

    setGuardando(true)
    const toastId = toastLoading(editando ? 'Guardando cambios...' : 'Creando motivo...')

    const payload = esPredefinido ? { emoji } : { descripcion, emoji }

    const res = await fetch(
      editando ? `/api/motivos-novedad/${editando.id}` : '/api/motivos-novedad',
      {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    setGuardando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError((data as { error?: string }).error ?? 'Error al guardar', toastId)
      return
    }

    toastSuccess(editando ? 'Motivo actualizado' : 'Motivo creado', toastId)
    cerrarModal()
    cargar()
  }

  async function cambiarActivo(m: MotivoNovedad, activo: boolean) {
    if (esMotivoPredefinido(m)) {
      toastError('Los motivos predefinidos no se pueden desactivar')
      return
    }

    menu.close()
    const toastId = toastLoading(activo ? 'Activando motivo...' : 'Desactivando motivo...')

    const res = await fetch(`/api/motivos-novedad/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError((data as { error?: string }).error ?? 'Error al actualizar', toastId)
      return
    }

    toastSuccess(activo ? 'Motivo activado' : 'Motivo desactivado', toastId)
    cargar()
  }

  const activos = motivos.filter((m) => m.activo)
  const inactivos = motivos.filter((m) => !m.activo)
  const motivoMenu = motivos.find((m) => m.id === menu.menuId)

  function filaMotivo(m: MotivoNovedad, atenuado = false) {
    const predefinido = esMotivoPredefinido(m)
    return (
      <li
        key={m.id}
        className={[
          'flex items-center justify-between gap-3 px-4 py-3',
          atenuado ? 'opacity-70' : '',
        ].join(' ')}
      >
        <span className="text-text-primary min-w-0 text-sm">
          <span className="mr-2" aria-hidden>
            {m.emoji}
          </span>
          {m.descripcion}
          {predefinido && (
            <span className="text-text-secondary ml-2 text-[10px] font-medium tracking-wide uppercase">
              Predefinido
            </span>
          )}
        </span>
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
          <h2 className="font-display text-text-primary text-lg">Motivos de novedad</h2>
          <p className="text-text-secondary mt-1 text-sm">
            Motivos para vasos que no se vendieron en el cierre del día.
          </p>
        </div>
        <Button type="button" size="sm" onClick={abrirNuevo} className="shrink-0">
          <Plus size={16} aria-hidden />
          Agregar
        </Button>
      </motion.div>

      {loading ? (
        <motion.div variants={fadeUp} className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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
                No hay motivos activos.
              </li>
            ) : (
              activos.map((m) => filaMotivo(m))
            )}
          </motion.ul>

          {inactivos.length > 0 && (
            <motion.div variants={fadeUp} className="space-y-2">
              <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                Inactivos
              </p>
              <ul className="divide-bg-border border-bg-border bg-bg-elevated/30 divide-y overflow-hidden rounded-[var(--radius-lg)] border">
                {inactivos.map((m) => filaMotivo(m, true))}
              </ul>
            </motion.div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? 'Editar motivo' : 'Nuevo motivo de novedad'}
      >
        <form onSubmit={guardarMotivo} className="space-y-4">
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label htmlFor="motivo-emoji" className="text-text-secondary text-sm font-medium">
              Emoji
            </label>
            <input
              id="motivo-emoji"
              type="text"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
              className="select-field w-full text-center text-2xl"
              placeholder="⚪"
              maxLength={8}
              required
            />
            <p className="text-text-muted text-xs">
              Vista previa:{' '}
              <span className="text-lg" aria-hidden>
                {form.emoji.trim() || '⚪'}
              </span>
            </p>
          </motion.div>

          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Ej. Vaso roto en transporte"
            disabled={editando ? esMotivoPredefinido(editando) : false}
            required={!editando || !esMotivoPredefinido(editando)}
          />

          {editando && esMotivoPredefinido(editando) && (
            <p className="text-text-muted text-xs">
              Los motivos predefinidos solo permiten cambiar el emoji.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={cerrarModal} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {editando ? 'Guardar cambios' : 'Crear motivo'}
            </Button>
          </div>
        </form>
      </Modal>

      <MenuAccionesPortal open={!!motivoMenu} position={menu.menuPos} menuRef={menu.menuRef}>
        {motivoMenu && (
          <>
            <MenuItem onClick={() => abrirEditar(motivoMenu)}>Editar</MenuItem>
            {!esMotivoPredefinido(motivoMenu) &&
              (motivoMenu.activo ? (
                <MenuItem tono="peligro" onClick={() => cambiarActivo(motivoMenu, false)}>
                  Desactivar
                </MenuItem>
              ) : (
                <MenuItem onClick={() => cambiarActivo(motivoMenu, true)}>Activar</MenuItem>
              ))}
          </>
        )}
      </MenuAccionesPortal>
    </motion.div>
  )
}
