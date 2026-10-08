'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { type CredencialesEmpleado } from '@/components/configuracion/ModalCredenciales'
import { generarPasswordSimple } from '@/lib/utils'
import { isValidPassword, PASSWORD_MIN } from '@/lib/validators'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Usuario } from '@/types'

/** El admin asigna una contraseña nueva a un empleado */
export function ResetPasswordModal({
  usuario: resetUsuario,
  onClose,
  onListo,
}: {
  usuario: Usuario | null
  onClose: () => void
  onListo: (credenciales: CredencialesEmpleado) => void
}) {
  const [resetPassword, setResetPassword] = useState('')
  const [reseteando, setReseteando] = useState(false)
  const [usuarioPrevio, setUsuarioPrevio] = useState<Usuario | null>(null)

  // Sugerir contraseña cada vez que se abre para otro usuario
  if (resetUsuario !== usuarioPrevio) {
    setUsuarioPrevio(resetUsuario)
    if (resetUsuario)
      setResetPassword(generarPasswordSimple(resetUsuario.email ?? resetUsuario.nombre))
  }

  async function confirmarReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUsuario) return
    if (!isValidPassword(resetPassword)) {
      toast.error(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
      return
    }
    setReseteando(true)
    const toastId = toastLoading('Cambiando contraseña...')
    try {
      const res = await fetch(`/api/usuarios/${resetUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toastError(data.error ?? 'No se pudo cambiar la contraseña', toastId)
        return
      }
      toastSuccess('Contraseña actualizada', toastId)
      onListo({
        email: resetUsuario.email ?? '',
        password: resetPassword,
        nombre: resetUsuario.nombre,
      })
    } catch {
      toastError('No se pudo cambiar la contraseña', toastId)
    } finally {
      setReseteando(false)
    }
  }

  return (
    <Modal
      open={resetUsuario !== null}
      onClose={() => !reseteando && onClose()}
      title="Restablecer contraseña"
    >
      <form onSubmit={confirmarReset} className="space-y-4">
        <p className="text-text-secondary text-sm">
          Nueva contraseña para{' '}
          <span className="text-text-primary font-medium">{resetUsuario?.nombre}</span>
          {resetUsuario?.email ? ` (${resetUsuario.email})` : ''}.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value.trim())}
            autoComplete="off"
            disabled={reseteando}
            className="input min-w-0 flex-1 font-mono text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            aria-label="Generar otra"
            title="Generar otra"
            disabled={reseteando}
            onClick={() =>
              setResetPassword(
                generarPasswordSimple(resetUsuario?.email ?? resetUsuario?.nombre ?? '')
              )
            }
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={reseteando}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={reseteando}
            disabled={reseteando}
            className="w-full sm:w-auto"
          >
            Guardar contraseña
          </Button>
        </div>
      </form>
    </Modal>
  )
}
