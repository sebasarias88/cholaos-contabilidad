'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { fadeUp } from '@/lib/animations'
import { createClient } from '@/lib/supabase/client'
import { isValidPassword } from '@/lib/validators'
import type { Usuario } from '@/types'

interface MiCuentaProps {
  usuario: Usuario
  email: string
  onNombreActualizado: (nombre: string) => void
}

export function MiCuenta({ usuario, email, onNombreActualizado }: MiCuentaProps) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  async function guardarNombre(e: React.FormEvent) {
    e.preventDefault()
    const nombreTrim = nombre.trim()
    if (!nombreTrim) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setGuardandoNombre(true)
    const id = toast.loading('Guardando nombre...')

    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombreTrim }),
    })

    setGuardandoNombre(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Error al guardar', { id })
      return
    }

    toast.success('Nombre actualizado', { id })
    onNombreActualizado(nombreTrim)
  }

  async function guardarPassword(e: React.FormEvent) {
    e.preventDefault()

    if (!passwordActual || !passwordNueva) {
      toast.error('Completa todos los campos de contraseña')
      return
    }
    if (!isValidPassword(passwordNueva)) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (passwordNueva !== passwordConfirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setGuardandoPassword(true)
    const id = toast.loading('Actualizando contraseña...')
    const supabase = createClient()

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: passwordActual,
    })

    if (loginError) {
      toast.error('La contraseña actual es incorrecta', { id })
      setGuardandoPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: passwordNueva })

    setGuardandoPassword(false)

    if (error) {
      toast.error(error.message || 'Error al cambiar contraseña', { id })
      return
    }

    toast.success('Contraseña actualizada', { id })
    setPasswordActual('')
    setPasswordNueva('')
    setPasswordConfirm('')
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8 max-w-md">
      <section className="space-y-4">
        <h2 className="font-display text-lg text-text-primary">Mi cuenta</h2>
        <p className="text-sm text-text-secondary">
          Actualiza tu nombre visible en el sistema y tu contraseña de acceso.
        </p>

        <form onSubmit={guardarNombre} className="card space-y-4 p-4">
          <Input label="Correo" value={email} disabled />
          <p className="text-xs text-text-muted -mt-2">
            El correo no se puede cambiar desde aquí.
          </p>
          <Input
            label="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={guardandoNombre}
          />
          <Button type="submit" disabled={guardandoNombre} className="w-full sm:w-auto">
            {guardandoNombre ? 'Guardando...' : 'Guardar nombre'}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-text-primary">Cambiar contraseña</h3>
        <form onSubmit={guardarPassword} className="card space-y-4 p-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            autoComplete="current-password"
            disabled={guardandoPassword}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            autoComplete="new-password"
            disabled={guardandoPassword}
          />
          <p className="text-xs text-text-muted -mt-2">Mínimo 8 caracteres</p>
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={guardandoPassword}
          />
          <Button type="submit" disabled={guardandoPassword} className="w-full sm:w-auto">
            {guardandoPassword ? 'Actualizando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </section>
    </motion.div>
  )
}
