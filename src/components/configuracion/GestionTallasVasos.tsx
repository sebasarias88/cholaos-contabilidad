'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { etiquetaTipoVaso, formatTalla } from '@/lib/utils'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { TallaVaso, TipoVaso } from '@/types'

type TallaForm = {
  onzas: string
  descripcion: string
  tipo: TipoVaso
}

const FORM_VACIO: TallaForm = { onzas: '', descripcion: '', tipo: 'normal' }

const TIPOS: { value: TipoVaso; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'ancho', label: 'Ancho' },
  { value: 'angosto', label: 'Angosto' },
]

function BadgeTipo({ tipo }: { tipo: TipoVaso }) {
  const styles =
    tipo === 'ancho'
      ? 'bg-accent-cyan-dim text-accent-cyan'
      : tipo === 'angosto'
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-bg-elevated text-text-secondary'

  return (
    <span
      className={[
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        styles,
      ].join(' ')}
    >
      {etiquetaTipoVaso(tipo)}
    </span>
  )
}

function etiquetaTalla(t: TallaVaso) {
  const desc = t.descripcion?.trim()
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="font-semibold tabular-nums text-text-primary">
        {formatTalla(t)}
      </span>
      <BadgeTipo tipo={t.tipo ?? 'normal'} />
      {desc && (
        <span className="text-text-secondary">
          <span className="text-text-muted"> — </span>
          {desc}
        </span>
      )}
    </span>
  )
}

export function GestionTallasVasos() {
  const [tallas, setTallas] = useState<TallaVaso[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<TallaVaso | null>(null)
  const [form, setForm] = useState<TallaForm>(FORM_VACIO)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/tallas-vasos?todas=1')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: TallaVaso[]) => {
        const lista = Array.isArray(data) ? data : []
        setTallas(
          lista.sort((a, b) => {
            if (a.onzas !== b.onzas) return a.onzas - b.onzas
            return a.tipo.localeCompare(b.tipo)
          })
        )
      })
      .catch(() => toastError('Error cargando tallas de vasos'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function abrirNueva() {
    setEditando(null)
    setForm(FORM_VACIO)
    setModalOpen(true)
  }

  function abrirEditar(t: TallaVaso) {
    setEditando(t)
    setForm({
      onzas: String(t.onzas),
      descripcion: t.descripcion ?? '',
      tipo: t.tipo ?? 'normal',
    })
    setModalOpen(true)
  }

  function cerrarModal() {
    setModalOpen(false)
    setEditando(null)
    setForm(FORM_VACIO)
  }

  async function guardarTalla(e: React.FormEvent) {
    e.preventDefault()
    const onzas = Number(form.onzas)
    if (!Number.isFinite(onzas) || onzas <= 0) {
      toastError('Ingresa las onzas (número mayor a 0)')
      return
    }

    setGuardando(true)
    const toastId = toastLoading(editando ? 'Guardando cambios...' : 'Creando talla...')

    const payload = {
      onzas,
      descripcion: form.descripcion.trim() || undefined,
      tipo: form.tipo,
    }

    const res = await fetch(
      editando ? `/api/tallas-vasos/${editando.id}` : '/api/tallas-vasos',
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

    toastSuccess(editando ? 'Talla actualizada' : 'Talla creada', toastId)
    cerrarModal()
    cargar()
  }

  async function cambiarActivo(t: TallaVaso, activo: boolean) {
    const toastId = toastLoading(activo ? 'Activando talla...' : 'Desactivando talla...')

    const res = await fetch(`/api/tallas-vasos/${t.id}`, {
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

    toastSuccess(activo ? 'Talla activada' : 'Talla desactivada', toastId)
    cargar()
  }

  const activas = tallas.filter((t) => t.activo)
  const inactivas = tallas.filter((t) => !t.activo)

  return (
    <motion.div variants={fadeUp} className="space-y-4">
      <p className="text-sm text-text-secondary">
        Define las tallas de vasos (onzas y tipo: normal, ancho o angosto) para el
        conteo del cierre.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-bg-border overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface">
            {activas.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-muted">
                No hay tallas activas. Agrega la primera.
              </li>
            ) : (
              activas.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="min-w-0 text-sm">{etiquetaTalla(t)}</p>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => abrirEditar(t)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-accent-red hover:text-accent-red"
                      onClick={() => cambiarActivo(t, false)}
                    >
                      Desactivar
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>

          {inactivas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Inactivas
              </p>
              <ul className="divide-y divide-bg-border overflow-hidden rounded-[var(--radius-lg)] border border-bg-border/60 bg-bg-elevated/30">
                {inactivas.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col gap-3 px-4 py-3 opacity-70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="min-w-0 text-sm">{etiquetaTalla(t)}</p>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => abrirEditar(t)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => cambiarActivo(t, true)}
                      >
                        Activar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Button type="button" variant="secondary" onClick={abrirNueva}>
        <Plus size={18} aria-hidden />
        Agregar nueva talla
      </Button>

      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? 'Editar talla' : 'Nueva talla de vaso'}
      >
        <form onSubmit={guardarTalla} className="space-y-4">
          <Input
            label="Onzas"
            type="number"
            min={1}
            step={1}
            required
            value={form.onzas}
            onChange={(e) => setForm((f) => ({ ...f, onzas: e.target.value }))}
            placeholder="Ej. 16"
          />
          <div className="space-y-1.5">
            <label htmlFor="talla-tipo" className="text-sm font-medium text-text-secondary">
              Tipo de vaso
            </label>
            <select
              id="talla-tipo"
              value={form.tipo}
              onChange={(e) =>
                setForm((f) => ({ ...f, tipo: e.target.value as TipoVaso }))
              }
              className="select-field w-full"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">
              Vista previa:{' '}
              <span className="text-text-secondary">
                {form.onzas
                  ? formatTalla({
                      onzas: Number(form.onzas) || 0,
                      tipo: form.tipo,
                    })
                  : '—'}
              </span>
            </p>
          </div>
          <Input
            label="Descripción (opcional)"
            value={form.descripcion}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
            placeholder="Ej. Cholao Grande, Raspao..."
          />
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
              {editando ? 'Guardar cambios' : 'Crear talla'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
