'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Check, Copy, MoreHorizontal, Plus, RefreshCw, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  ModalCredenciales,
  type CredencialesEmpleado,
} from '@/components/configuracion/ModalCredenciales'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import { generarPassword } from '@/lib/utils'
import { isValidEmail, isValidPassword } from '@/lib/validators'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Usuario } from '@/types'

interface GestionEquipoProps {
  usuarioActualId: string
}

type FilaEquipo = Usuario & { esYo: boolean }

function ordenarEquipo(usuarios: Usuario[], actualId: string): FilaEquipo[] {
  const admin = usuarios.find((u) => u.rol === 'admin')
  const empleados = usuarios
    .filter((u) => u.rol === 'empleado')
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const lista = [...(admin ? [admin] : []), ...empleados]
  return lista.map((u) => ({ ...u, esYo: u.id === actualId }))
}

function EstadoUsuario({ activo }: { activo: boolean }) {
  if (activo) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <Check size={14} className="shrink-0 text-accent-green" />
        <span className="text-accent-green">Activo</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <X size={14} className="shrink-0 text-accent-red" />
      <span className="text-accent-red">Inactivo</span>
    </span>
  )
}

function BotonMenuEquipo({
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
      className="focus-ring-cyan inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
    >
      <MoreHorizontal size={20} />
    </button>
  )
}

function EquipoLista({
  filas,
  menuAbierto,
  onToggleMenu,
}: {
  filas: FilaEquipo[]
  menuAbierto: string | null
  onToggleMenu: (u: FilaEquipo, e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  if (filas.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        No hay usuarios en el equipo
      </p>
    )
  }

  return (
    <>
      {/* Vista móvil: tarjetas */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filas.map((u) => (
          <li
            key={u.id}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-bg-border bg-bg-surface"
          >
            <div className="flex items-start gap-2 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-text-primary">
                  {u.nombre}
                  {u.esYo && (
                    <span className="ml-1.5 text-xs font-normal text-text-muted">
                      (tú)
                    </span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={u.rol === 'admin' ? 'admin' : 'empleado'}>
                    {u.rol === 'admin' ? 'Admin' : 'Empleado'}
                  </Badge>
                  <EstadoUsuario activo={u.activo} />
                </div>
              </div>
              {u.rol === 'empleado' && (
                <BotonMenuEquipo
                  abierto={menuAbierto === u.id}
                  onClick={(e) => onToggleMenu(u, e)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Vista escritorio: tabla */}
      <div className="table-surface hidden overflow-x-auto md:block">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((u) => (
              <tr key={u.id} className="border-t border-bg-border">
                <td className="px-4 py-3 font-medium text-text-primary">
                  {u.nombre}
                  {u.esYo && (
                    <span className="ml-2 text-xs font-normal text-text-muted">
                      (tú)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.rol === 'admin' ? 'admin' : 'empleado'}>
                    {u.rol === 'admin' ? 'Admin' : 'Empleado'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <EstadoUsuario activo={u.activo} />
                </td>
                <td className="px-4 py-3 text-right">
                  {u.rol === 'empleado' && (
                    <BotonMenuEquipo
                      abierto={menuAbierto === u.id}
                      onClick={(e) => onToggleMenu(u, e)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function GestionEquipo({ usuarioActualId }: GestionEquipoProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  )
  const menuRef = useRef<HTMLDivElement>(null)

  const [modalNuevo, setModalNuevo] = useState(false)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState(() => generarPassword())
  const [guardando, setGuardando] = useState(false)
  const [credenciales, setCredenciales] = useState<CredencialesEmpleado | null>(
    null
  )

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/usuarios')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: Usuario[]) => setUsuarios(data))
      .catch(() => toast.error('Error cargando el equipo'))
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

  function toggleMenuEmpleado(
    u: FilaEquipo,
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    if (menuAbierto === u.id) {
      setMenuAbierto(null)
      setMenuPos(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right })
    setMenuAbierto(u.id)
  }

  function abrirNuevo() {
    setEmail('')
    setNombre('')
    setPassword(generarPassword())
    setModalNuevo(true)
  }

  async function copiarPasswordModal() {
    try {
      await navigator.clipboard.writeText(password)
      toast.success('Contraseña copiada')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  async function crearEmpleado(e: React.FormEvent) {
    e.preventDefault()

    const nombreTrim = nombre.trim()
    const emailTrim = email.trim().toLowerCase()

    if (!nombreTrim) {
      toast.error('El nombre es requerido')
      return
    }
    if (!isValidEmail(emailTrim)) {
      toast.error('Ingresa un correo válido')
      return
    }
    if (!isValidPassword(password)) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setGuardando(true)
    const id = toast.loading('Creando cuenta...')

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrim,
          nombre: nombreTrim,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al crear empleado', { id })
        return
      }

      toast.success('Empleado creado. Comparte las credenciales con él.', { id })
      setModalNuevo(false)
      setCredenciales({
        email: emailTrim,
        password,
        nombre: nombreTrim,
      })
      cargar()
    } catch {
      toast.error('Error al crear empleado', { id })
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(u: Usuario, activo: boolean) {
    if (u.rol === 'admin') {
      toast.error('No se puede modificar la cuenta del admin')
      return
    }
    if (u.id === usuarioActualId) {
      toast.error('No puedes desactivar tu propia cuenta')
      return
    }

    setMenuAbierto(null)
    setMenuPos(null)
    const toastId = toastLoading(activo ? 'Activando empleado...' : 'Desactivando empleado...')

    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toastError(data.error ?? 'Error al actualizar', toastId)
      return
    }

    toastSuccess(activo ? 'Empleado activado' : 'Empleado desactivado', toastId)
    cargar()
  }

  const filas = ordenarEquipo(usuarios, usuarioActualId)
  const empleadoMenu = filas.find(
    (u) => u.id === menuAbierto && u.rol === 'empleado'
  )

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="min-w-0 space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg text-text-primary">Equipo</h2>
        <Button
          type="button"
          onClick={abrirNuevo}
          size="sm"
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus size={16} />
          Nuevo empleado
        </Button>
      </div>

      {loading ? (
        <SkeletonTabla filas={4} />
      ) : (
        <EquipoLista
          filas={filas}
          menuAbierto={menuAbierto}
          onToggleMenu={toggleMenuEmpleado}
        />
      )}

      <Modal
        open={modalNuevo}
        onClose={() => !guardando && setModalNuevo(false)}
        title="Nuevo empleado"
      >
        <form onSubmit={crearEmpleado} className="space-y-4">
          <Input
            label="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej. Carlos Pérez"
            disabled={guardando}
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="empleado@cholaooscar.com"
            disabled={guardando}
          />
          <div className="space-y-1.5">
            <label className="text-sm text-text-secondary">
              Contraseña inicial
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                readOnly
                value={password}
                className="input min-w-0 flex-1 font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copiarPasswordModal}
                  aria-label="Copiar contraseña"
                  title="Copiar contraseña"
                  className="flex-1 sm:flex-none"
                >
                  <Copy size={16} />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPassword(generarPassword())}
                  aria-label="Generar nueva contraseña"
                  title="Generar nueva"
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>
            <p className="text-xs text-text-muted">Mínimo 8 caracteres</p>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalNuevo(false)}
              disabled={guardando}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando}
              className="w-full sm:w-auto"
            >
              {guardando ? 'Creando...' : 'Crear empleado'}
            </Button>
          </div>
        </form>
      </Modal>

      <ModalCredenciales
        credenciales={credenciales}
        onClose={() => setCredenciales(null)}
      />

      {menuAbierto &&
        menuPos &&
        empleadoMenu &&
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
            {empleadoMenu.activo ? (
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-bg-elevated"
                onClick={() => cambiarEstado(empleadoMenu, false)}
              >
                Desactivar
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
                onClick={() => cambiarEstado(empleadoMenu, true)}
              >
                Activar
              </button>
            )}
          </div>,
          document.body
        )}
    </motion.div>
  )
}
