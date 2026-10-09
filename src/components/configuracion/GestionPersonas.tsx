'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BotonAcciones } from '@/components/ui/BotonAcciones'
import { ConfirmarModal } from '@/components/ui/ConfirmarModal'
import { Input } from '@/components/ui/Input'
import { MenuAccionesPortal, MenuItem, MenuSeparador } from '@/components/ui/MenuAccionesPortal'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMenuAcciones } from '@/hooks/useMenuAcciones'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { BadgeTipoPersona } from '@/components/descuentos/BadgeTipoPersona'
import { etiquetaTipoPersona, TIPOS_PERSONA } from '@/lib/descuentos'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { PersonaDescuento, TipoPersonaDescuento } from '@/types'

async function pedir(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as { error?: string }).error ?? 'Algo salió mal')
  return body
}

const json = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

/** Personas a las que se les descuenta (empleados, familia, clientes con fiado) */
export function GestionPersonas() {
  const [personas, setPersonas] = useState<PersonaDescuento[]>([])
  const [loading, setLoading] = useState(true)
  const menu = useMenuAcciones()

  const [modal, setModal] = useState<{ persona: PersonaDescuento | null } | null>(null)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoPersonaDescuento>('empleado')
  const [guardando, setGuardando] = useState(false)

  const [unir, setUnir] = useState<PersonaDescuento | null>(null)
  const [destino, setDestino] = useState('')
  const [eliminar, setEliminar] = useState<PersonaDescuento | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(() => {
    pedir('/api/personas-descuento?todas=1')
      .then((data: PersonaDescuento[]) => setPersonas(Array.isArray(data) ? data : []))
      .catch((e: Error) => toastError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function abrir(persona: PersonaDescuento | null) {
    menu.close()
    setNombre(persona?.nombre ?? '')
    setTipo(persona?.tipo ?? 'empleado')
    setModal({ persona })
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    const valor = nombre.trim()
    if (!valor) return toastError('Escribe el nombre')
    setGuardando(true)
    const id = toastLoading('Guardando...')
    try {
      if (modal.persona) {
        await pedir(
          `/api/personas-descuento/${modal.persona.id}`,
          json('PUT', { nombre: valor, tipo })
        )
      } else {
        await pedir('/api/personas-descuento', json('POST', { nombre: valor, tipo }))
      }
      toastSuccess(modal.persona ? 'Persona actualizada' : 'Persona creada', id)
      setModal(null)
      cargar()
    } catch (err) {
      toastError((err as Error).message, id)
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarActivo(p: PersonaDescuento) {
    menu.close()
    const id = toastLoading(p.activo ? 'Desactivando...' : 'Activando...')
    try {
      await pedir(`/api/personas-descuento/${p.id}`, json('PUT', { activo: !p.activo }))
      toastSuccess(p.activo ? 'Persona desactivada' : 'Persona activada', id)
      cargar()
    } catch (err) {
      toastError((err as Error).message, id)
    }
  }

  async function confirmarUnir() {
    if (!unir || !destino) return
    setOcupado(true)
    const id = toastLoading('Uniendo...')
    try {
      await pedir('/api/personas-descuento/unir', json('POST', { origen: unir.id, destino }))
      const nombreDestino = personas.find((p) => p.id === destino)?.nombre ?? ''
      toastSuccess(`Todo quedó a nombre de ${nombreDestino}`, id)
      setUnir(null)
      cargar()
    } catch (err) {
      toastError((err as Error).message, id)
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarEliminar() {
    if (!eliminar) return
    setOcupado(true)
    const id = toastLoading('Eliminando...')
    try {
      await pedir(`/api/personas-descuento/${eliminar.id}`, { method: 'DELETE' })
      toastSuccess('Persona eliminada', id)
      setEliminar(null)
      cargar()
    } catch (err) {
      toastError((err as Error).message, id)
    } finally {
      setOcupado(false)
    }
  }

  const activos = personas.filter((p) => p.activo)
  const inactivos = personas.filter((p) => !p.activo)
  const personaMenu = personas.find((p) => p.id === menu.menuId)

  function fila(p: PersonaDescuento, atenuado = false) {
    const n = p.total_descuentos ?? 0
    return (
      <li
        key={p.id}
        className={`flex items-center justify-between gap-3 px-4 py-3 ${atenuado ? 'opacity-70' : ''}`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-text-primary min-w-0 truncate text-sm font-bold">{p.nombre}</span>
          <BadgeTipoPersona tipo={p.tipo} />
          <span className="text-text-muted text-xs">
            {n === 0 ? 'Sin descuentos' : `${n} descuento${n === 1 ? '' : 's'}`}
          </span>
        </div>
        <BotonAcciones abierto={menu.isOpen(p.id)} onClick={(e) => menu.toggle(p.id, e)} />
      </li>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="font-display text-text-primary text-xl font-bold">Personas</h2>
          <p className="text-text-secondary mt-1 text-sm">
            A quién se le descuenta en el cierre: empleados, familia o clientes con fiado. La cajera
            también puede crearlas desde el cierre.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => abrir(null)} className="shrink-0">
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
                Aún no hay personas. Se crean aquí o desde el cierre al agregar un descuento.
              </li>
            ) : (
              activos.map((p) => fila(p))
            )}
          </motion.ul>
          {inactivos.length > 0 && (
            <motion.div variants={fadeUp} className="space-y-2">
              <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                Inactivas (no salen en el cierre)
              </p>
              <ul className="divide-bg-border border-bg-border bg-bg-elevated/30 divide-y overflow-hidden rounded-[var(--radius-lg)] border">
                {inactivos.map((p) => fila(p, true))}
              </ul>
            </motion.div>
          )}
        </>
      )}

      <Modal
        open={modal !== null}
        onClose={() => !guardando && setModal(null)}
        title={modal?.persona ? 'Editar persona' : 'Nueva persona'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Eliana"
            maxLength={60}
            autoFocus
          />
          <div className="space-y-1.5">
            <span className="text-text-secondary text-sm font-bold">Tipo</span>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_PERSONA.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tipo === t.id}
                  onClick={() => setTipo(t.id)}
                  className={`focus-ring min-h-11 rounded-[12px] border text-sm font-bold transition-colors ${
                    tipo === t.id
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-bg-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {modal?.persona ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <MenuAccionesPortal open={!!personaMenu} position={menu.menuPos} menuRef={menu.menuRef}>
        {personaMenu && (
          <>
            <MenuItem onClick={() => abrir(personaMenu)}>Editar</MenuItem>
            <MenuItem
              onClick={() => {
                menu.close()
                setDestino('')
                setUnir(personaMenu)
              }}
            >
              Unir con otra persona
            </MenuItem>
            <MenuItem onClick={() => cambiarActivo(personaMenu)}>
              {personaMenu.activo ? 'Desactivar' : 'Activar'}
            </MenuItem>
            <MenuSeparador />
            <MenuItem
              tono="peligro"
              onClick={() => {
                menu.close()
                setEliminar(personaMenu)
              }}
            >
              Eliminar
            </MenuItem>
          </>
        )}
      </MenuAccionesPortal>

      <ConfirmarModal
        open={unir !== null}
        titulo={`Unir «${unir?.nombre ?? ''}» con otra persona`}
        textoConfirmar="Unir"
        variante="primary"
        cargando={ocupado}
        deshabilitado={!destino}
        onCancelar={() => setUnir(null)}
        onConfirmar={confirmarUnir}
      >
        <p className="mb-3">
          Todos los descuentos de <b className="text-text-primary">{unir?.nombre}</b> pasan a la
          persona que elijas y «{unir?.nombre}» desaparece. Sirve cuando el mismo nombre quedó
          escrito de dos formas (ej. «Eli» y «Eliana»).
        </p>
        <div className="flex">
          <Select
            value={destino}
            onChange={setDestino}
            placeholder="Pasar todo a…"
            aria-label="Persona de destino"
            options={personas
              .filter((p) => p.id !== unir?.id)
              .map((p) => ({ value: p.id, label: `${p.nombre} · ${etiquetaTipoPersona(p.tipo)}` }))}
          />
        </div>
      </ConfirmarModal>

      <ConfirmarModal
        open={eliminar !== null}
        titulo="Eliminar persona"
        cargando={ocupado}
        onCancelar={() => setEliminar(null)}
        onConfirmar={confirmarEliminar}
      >
        ¿Eliminar a <b className="text-text-primary">{eliminar?.nombre}</b>? Solo se puede si no
        tiene descuentos; si tiene, desactívala o únela con otra persona.
      </ConfirmarModal>
    </motion.div>
  )
}
