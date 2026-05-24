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
import { esMotivoPredefinido } from '@/lib/motivos-novedad'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { MotivoNovedad } from '@/types'

type MotivoForm = {
  descripcion: string
  emoji: string
}

const FORM_VACIO: MotivoForm = { descripcion: '', emoji: '⚪' }

function BotonMenuMotivo({
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

export function GestionMotivosNovedad() {
  const [motivos, setMotivos] = useState<MotivoNovedad[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<MotivoNovedad | null>(null)
  const [form, setForm] = useState<MotivoForm>(FORM_VACIO)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  )
  const menuRef = useRef<HTMLDivElement>(null)

  const cargar = useCallback(() => {
    setLoading(true)
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

  function toggleMenu(m: MotivoNovedad, e: React.MouseEvent<HTMLButtonElement>) {
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
    setForm(FORM_VACIO)
    setModalOpen(true)
  }

  function abrirEditar(m: MotivoNovedad) {
    setMenuAbierto(null)
    setMenuPos(null)
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

    const payload = esPredefinido
      ? { emoji }
      : { descripcion, emoji }

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
      toastError(
        (data as { error?: string }).error ?? 'Error al guardar',
        toastId
      )
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

    setMenuAbierto(null)
    setMenuPos(null)
    const toastId = toastLoading(activo ? 'Activando motivo...' : 'Desactivando motivo...')

    const res = await fetch(`/api/motivos-novedad/${m.id}`, {
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

    toastSuccess(activo ? 'Motivo activado' : 'Motivo desactivado', toastId)
    cargar()
  }

  const activos = motivos.filter((m) => m.activo)
  const inactivos = motivos.filter((m) => !m.activo)
  const motivoMenu = motivos.find((m) => m.id === menuAbierto)

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
        <span className="min-w-0 text-sm text-text-primary">
          <span className="mr-2" aria-hidden>
            {m.emoji}
          </span>
          {m.descripcion}
          {predefinido && (
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-text-muted">
              Predefinido
            </span>
          )}
        </span>
        <BotonMenuMotivo
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
            Motivos de novedad
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
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
            className="divide-y divide-bg-border overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface"
          >
            {activos.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-muted">
                No hay motivos activos.
              </li>
            ) : (
              activos.map((m) => filaMotivo(m))
            )}
          </motion.ul>

          {inactivos.length > 0 && (
            <motion.div variants={fadeUp} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Inactivos
              </p>
              <ul className="divide-y divide-bg-border overflow-hidden rounded-[var(--radius-lg)] border border-bg-border/60 bg-bg-elevated/30">
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
            <label htmlFor="motivo-emoji" className="text-sm font-medium text-text-secondary">
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
            <p className="text-xs text-text-muted">
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
            <p className="text-xs text-text-muted">
              Los motivos predefinidos solo permiten cambiar el emoji.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {editando ? 'Guardar cambios' : 'Crear motivo'}
            </Button>
          </div>
        </form>
      </Modal>

      {menuAbierto &&
        menuPos &&
        motivoMenu &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] min-w-[10rem] rounded-[var(--radius-md)] border border-bg-border bg-bg-surface py-1 shadow-xl"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              transform: 'translateX(-100%)',
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
              onClick={() => abrirEditar(motivoMenu)}
            >
              Editar
            </button>
            {!esMotivoPredefinido(motivoMenu) &&
              (motivoMenu.activo ? (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-bg-elevated"
                  onClick={() => cambiarActivo(motivoMenu, false)}
                >
                  Desactivar
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
                  onClick={() => cambiarActivo(motivoMenu, true)}
                >
                  Activar
                </button>
              ))}
          </div>,
          document.body
        )}
    </motion.div>
  )
}
