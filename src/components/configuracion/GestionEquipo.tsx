'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmarModal } from '@/components/ui/ConfirmarModal'
import { MenuAccionesPortal, MenuItem, MenuSeparador } from '@/components/ui/MenuAccionesPortal'
import { useMenuAcciones } from '@/hooks/useMenuAcciones'
import {
  ModalCredenciales,
  type CredencialesEmpleado,
} from '@/components/configuracion/ModalCredenciales'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Usuario } from '@/types'
import { EquipoLista, ordenarEquipo } from '@/components/configuracion/equipo/EquipoLista'
import { NuevoEmpleadoModal } from '@/components/configuracion/equipo/NuevoEmpleadoModal'
import { ResetPasswordModal } from '@/components/configuracion/equipo/ResetPasswordModal'

interface GestionEquipoProps {
  usuarioActualId: string
}

export function GestionEquipo({ usuarioActualId }: GestionEquipoProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const menu = useMenuAcciones()

  const [modalNuevo, setModalNuevo] = useState(false)
  const [resetUsuario, setResetUsuario] = useState<Usuario | null>(null)
  const [credenciales, setCredenciales] = useState<CredencialesEmpleado | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(() => {
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

  function abrirReset(u: Usuario) {
    menu.close()
    setResetUsuario(u)
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

    menu.close()
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

  function pedirEliminar(u: Usuario) {
    if (u.rol === 'admin') {
      toast.error('No se puede eliminar la cuenta del admin')
      return
    }
    if (u.id === usuarioActualId) {
      toast.error('No puedes eliminar tu propia cuenta')
      return
    }
    menu.close()
    setEliminarId(u.id)
  }

  async function confirmarEliminar() {
    if (!eliminarId) return

    setEliminando(true)
    const toastId = toastLoading('Eliminando cuenta...')

    try {
      const res = await fetch(`/api/usuarios/${eliminarId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toastError(data.error ?? 'Error al eliminar', toastId)
        return
      }

      toastSuccess('Cuenta eliminada', toastId)
      setEliminarId(null)
      cargar()
    } catch {
      toastError('Error al eliminar', toastId)
    } finally {
      setEliminando(false)
    }
  }

  const filas = ordenarEquipo(usuarios, usuarioActualId)
  const empleadoMenu = filas.find((u) => u.id === menu.menuId && u.rol === 'empleado')
  const empleadoEliminar = filas.find((u) => u.id === eliminarId)

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-text-primary text-xl font-bold">Equipo</h2>
        <Button
          type="button"
          onClick={() => setModalNuevo(true)}
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
          menuAbierto={menu.menuId}
          onToggleMenu={(u, e) => menu.toggle(u.id, e)}
        />
      )}

      <NuevoEmpleadoModal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onCreado={(c) => {
          setModalNuevo(false)
          setCredenciales(c)
          cargar()
        }}
      />

      <ResetPasswordModal
        usuario={resetUsuario}
        onClose={() => setResetUsuario(null)}
        onListo={(c) => {
          setResetUsuario(null)
          setCredenciales(c)
        }}
      />

      <ModalCredenciales credenciales={credenciales} onClose={() => setCredenciales(null)} />

      <MenuAccionesPortal open={!!empleadoMenu} position={menu.menuPos} menuRef={menu.menuRef}>
        {empleadoMenu && (
          <>
            {empleadoMenu.activo ? (
              <MenuItem onClick={() => cambiarEstado(empleadoMenu, false)}>Desactivar</MenuItem>
            ) : (
              <MenuItem onClick={() => cambiarEstado(empleadoMenu, true)}>Activar</MenuItem>
            )}
            <MenuItem onClick={() => abrirReset(empleadoMenu)}>Restablecer contraseña</MenuItem>
            <MenuSeparador />
            <MenuItem tono="peligro" onClick={() => pedirEliminar(empleadoMenu)}>
              Eliminar
            </MenuItem>
          </>
        )}
      </MenuAccionesPortal>

      <ConfirmarModal
        open={eliminarId !== null}
        titulo="Eliminar cuenta"
        cargando={eliminando}
        onCancelar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
      >
        ¿Eliminar permanentemente la cuenta de{' '}
        <span className="text-text-primary font-medium">
          {empleadoEliminar?.nombre ?? 'este empleado'}
        </span>
        ? No podrá volver a iniciar sesión. Si ya hizo cierres, no se podrá borrar (usa Desactivar
        en ese caso).
      </ConfirmarModal>
    </motion.div>
  )
}
