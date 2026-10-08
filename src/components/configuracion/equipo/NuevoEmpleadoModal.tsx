'use client'

import { useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { type CredencialesEmpleado } from '@/components/configuracion/ModalCredenciales'
import { generarPasswordSimple } from '@/lib/utils'
import { isValidEmail, isValidPassword, PASSWORD_MIN } from '@/lib/validators'
import toast from 'react-hot-toast'

/** Crear cuenta de empleado con contraseña fácil (inicio del correo + 4 números) */
export function NuevoEmpleadoModal({
  open,
  onClose,
  onCreado,
}: {
  open: boolean
  onClose: () => void
  onCreado: (credenciales: CredencialesEmpleado) => void
}) {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [passwordEditada, setPasswordEditada] = useState(false)
  const [guardando, setGuardando] = useState(false)

  function cerrar() {
    if (guardando) return
    setEmail('')
    setNombre('')
    setPassword('')
    setPasswordEditada(false)
    onClose()
  }

  /** La contraseña sugerida sigue al correo hasta que el admin la edite */
  function cambiarEmail(valor: string) {
    setEmail(valor)
    if (!passwordEditada) {
      setPassword(valor.includes('@') || valor.length > 2 ? generarPasswordSimple(valor) : '')
    }
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
      toast.error(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
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
      onCreado({
        email: emailTrim,
        password,
        nombre: nombreTrim,
      })
    } catch {
      toast.error('Error al crear empleado', { id })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open={open} onClose={cerrar} title="Nuevo empleado">
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
          onChange={(e) => cambiarEmail(e.target.value)}
          required
          placeholder="empleado@cholaooscar.com"
          disabled={guardando}
        />
        <div className="space-y-1.5">
          <label className="text-text-secondary text-sm">Contraseña inicial</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.trim())
                setPasswordEditada(true)
              }}
              placeholder="Se genera con el correo"
              autoComplete="off"
              disabled={guardando}
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
                onClick={() => {
                  setPassword(generarPasswordSimple(email || nombre))
                  setPasswordEditada(false)
                }}
                aria-label="Generar nueva contraseña"
                title="Generar nueva"
                className="flex-1 sm:flex-none"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          <p className="text-text-muted text-xs">
            Fácil de recordar: inicio del correo + 4 números. Puedes escribir otra (mínimo{' '}
            {PASSWORD_MIN} caracteres).
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={cerrar}
            disabled={guardando}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando} className="w-full sm:w-auto">
            {guardando ? 'Creando...' : 'Crear empleado'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
