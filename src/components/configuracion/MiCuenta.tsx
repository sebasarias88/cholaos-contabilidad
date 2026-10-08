'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { getIniciales } from '@/lib/utils'
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

  const nombreDirty = nombre.trim() !== usuario.nombre.trim()

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
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordNueva !== passwordConfirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setGuardandoPassword(true)
    const id = toast.loading('Actualizando contraseña...')

    const res = await fetch('/api/auth', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passwordActual,
        passwordNueva,
      }),
    })

    setGuardandoPassword(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error((data as { error?: string }).error ?? 'Error al cambiar contraseña', { id })
      return
    }

    toast.success('Contraseña actualizada', { id })
    setPasswordActual('')
    setPasswordNueva('')
    setPasswordConfirm('')
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex w-full min-w-0 flex-col gap-5"
    >
      {/* Cabecera de perfil — ancho completo */}
      <motion.section
        variants={fadeUp}
        className="border-bg-border bg-bg-surface flex flex-col gap-4 rounded-[var(--radius-lg)] border p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="bg-brand-soft font-display text-brand flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold sm:h-20 sm:w-20 sm:text-2xl"
            aria-hidden
          >
            {getIniciales(usuario.nombre)}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-text-primary truncate text-xl font-semibold sm:text-2xl">
              {usuario.nombre}
            </h2>
            <p className="text-text-secondary mt-1 truncate text-sm">{email}</p>
          </div>
        </div>
        <span className="bg-brand-soft text-brand w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize">
          {usuario.rol}
        </span>
      </motion.section>

      {/* Dos columnas: perfil + seguridad */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-2 lg:items-stretch">
        <motion.section
          variants={fadeUp}
          className="border-bg-border bg-bg-surface flex min-w-0 flex-col rounded-[var(--radius-lg)] border"
        >
          <div className="border-bg-border flex items-start gap-3 border-b px-5 py-4 sm:px-6">
            <div className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]">
              <UserRound size={18} aria-hidden />
            </div>
            <div>
              <h3 className="font-display text-text-primary text-base font-semibold">
                Datos personales
              </h3>
              <p className="text-text-secondary mt-0.5 text-sm">
                Actualiza cómo apareces en el sistema
              </p>
            </div>
          </div>

          <form onSubmit={guardarNombre} className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
            <Input label="Correo electrónico" value={email} disabled />
            <p className="text-text-muted -mt-2 text-xs">
              El correo no se puede cambiar desde aquí.
            </p>

            <Input
              label="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={guardandoNombre}
            />

            <div className="mt-auto pt-2">
              <Button
                type="submit"
                loading={guardandoNombre}
                disabled={!nombreDirty || guardandoNombre}
                className="w-full sm:w-auto"
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="border-bg-border bg-bg-surface flex min-w-0 flex-col rounded-[var(--radius-lg)] border"
        >
          <div className="border-bg-border flex items-start gap-3 border-b px-5 py-4 sm:px-6">
            <div className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]">
              <KeyRound size={18} aria-hidden />
            </div>
            <div>
              <h3 className="font-display text-text-primary text-base font-semibold">Seguridad</h3>
              <p className="text-text-secondary mt-0.5 text-sm">Cambia tu contraseña de acceso</p>
            </div>
          </div>

          <form onSubmit={guardarPassword} className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
            <Input
              label="Contraseña actual"
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              autoComplete="current-password"
              disabled={guardandoPassword}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nueva contraseña"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                autoComplete="new-password"
                disabled={guardandoPassword}
              />
              <Input
                label="Confirmar"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={guardandoPassword}
              />
            </div>
            <p className="text-text-muted -mt-2 text-xs">
              La nueva contraseña debe tener al menos 6 caracteres.
            </p>

            <div className="mt-auto pt-2">
              <Button
                type="submit"
                loading={guardandoPassword}
                disabled={guardandoPassword}
                className="w-full sm:w-auto"
              >
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </motion.section>
      </div>
    </motion.div>
  )
}
