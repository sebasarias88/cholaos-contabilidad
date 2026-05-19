'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Plus, RefreshCw, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProductoSwitch } from '@/components/productos/ProductoSwitch'
import { SkeletonTabla } from '@/components/ui/Skeleton'
import { fadeUp, staggerContainer, listItem } from '@/lib/animations'
import { generarPassword, getIniciales } from '@/lib/utils'
import toast from 'react-hot-toast'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { Usuario } from '@/types'

export function GestionEquipo() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  const [modalNuevo, setModalNuevo] = useState(false)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState(() => generarPassword())
  const [guardando, setGuardando] = useState(false)

  const [credenciales, setCredenciales] = useState<{
    email: string
    password: string
    nombre: string
  } | null>(null)

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

  function abrirNuevo() {
    setEmail('')
    setNombre('')
    setPassword(generarPassword())
    setModalNuevo(true)
  }

  async function crearEmpleado(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    const id = toast.loading('Creando cuenta...')

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          nombre: nombre.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al crear empleado', { id })
        return
      }

      toast.success('Empleado creado', { id })
      setModalNuevo(false)
      setCredenciales({
        email: email.trim().toLowerCase(),
        password,
        nombre: nombre.trim(),
      })
      cargar()
    } catch {
      toast.error('Error al crear empleado', { id })
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(u: Usuario) {
    if (u.rol === 'dueno') return

    const toastId = toastLoading(
      u.activo ? 'Desactivando empleado...' : 'Activando empleado...'
    )

    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    })

    if (!res.ok) {
      toastError('Error al actualizar', toastId)
      return
    }

    toastSuccess(u.activo ? 'Empleado desactivado' : 'Empleado activado', toastId)
    cargar()
  }

  async function copiarCredenciales() {
    if (!credenciales) return
    const texto = `Cholaos — acceso al sistema\nNombre: ${credenciales.nombre}\nCorreo: ${credenciales.email}\nContraseña: ${credenciales.password}\nEntra en: ${window.location.origin}/login`
    try {
      await navigator.clipboard.writeText(texto)
      toast.success('Credenciales copiadas')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const empleados = usuarios.filter((u) => u.rol === 'empleado')
  const dueno = usuarios.find((u) => u.rol === 'dueno')

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-secondary max-w-lg">
          Crea cuentas para tu equipo aquí. Los empleados inician sesión en{' '}
          <span className="text-text-primary">/login</span> con las credenciales que
          les compartas.
        </p>
        <Button type="button" onClick={abrirNuevo} className="shrink-0">
          <Plus size={16} />
          Nuevo empleado
        </Button>
      </motion.div>

      {loading ? (
        <SkeletonTabla filas={4} />
      ) : (
        <motion.ul variants={staggerContainer} className="space-y-2">
          {dueno && (
            <motion.li
              key={dueno.id}
              variants={listItem}
              className="card flex flex-wrap items-center gap-4 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-cyan-dim text-sm font-medium text-accent-cyan">
                {getIniciales(dueno.nombre)}
              </div>
              <motion.div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{dueno.nombre}</p>
              </motion.div>
              <Badge variant="dueno">Dueño</Badge>
              <Badge variant="activo">Activo</Badge>
            </motion.li>
          )}

          {empleados.map((u) => (
            <motion.li
              key={u.id}
              variants={listItem}
              className="card flex flex-wrap items-center gap-4 p-4"
            >
              <motion.div
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                  u.activo
                    ? 'bg-bg-elevated text-text-secondary'
                    : 'bg-bg-border text-text-muted opacity-60',
                ].join(' ')}
              >
                {getIniciales(u.nombre)}
              </motion.div>
              <motion.div className="min-w-0 flex-1">
                <p
                  className={[
                    'font-medium',
                    u.activo ? 'text-text-primary' : 'text-text-muted line-through',
                  ].join(' ')}
                >
                  {u.nombre}
                </p>
              </motion.div>
              <Badge variant="empleado">Empleado</Badge>
              <Badge variant={u.activo ? 'activo' : 'inactivo'}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <ProductoSwitch
                active={u.activo}
                onChange={() => toggleActivo(u)}
              />
            </motion.li>
          ))}

          {empleados.length === 0 && (
            <motion.li
              variants={fadeUp}
              className="card flex flex-col items-center gap-2 p-8 text-center text-text-secondary"
            >
              <Users size={28} className="text-text-muted" />
              <p>No hay empleados registrados</p>
              <p className="text-sm">Agrega el primero con el botón de arriba</p>
            </motion.li>
          )}
        </motion.ul>
      )}

      <Modal open={modalNuevo} onClose={() => !guardando && setModalNuevo(false)} title="Nuevo empleado">
        <form onSubmit={crearEmpleado} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej. María López"
          />
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="empleado@ejemplo.com"
          />
          <motion.div className="space-y-1.5">
            <label className="text-sm text-text-secondary">Contraseña temporal</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={password}
                className="input flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPassword(generarPassword())}
                aria-label="Generar nueva contraseña"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
            <p className="text-xs text-text-muted">
              Compártela con el empleado; podrá cambiarla después en Supabase si lo
              configuras.
            </p>
          </motion.div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalNuevo(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Creando...' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!credenciales}
        onClose={() => setCredenciales(null)}
        title="Credenciales del empleado"
      >
        {credenciales && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Copia y envía estos datos a{' '}
              <span className="text-text-primary">{credenciales.nombre}</span>. Solo se
              muestran una vez.
            </p>
            <dl className="card space-y-3 p-4 text-sm">
              <div>
                <dt className="text-text-muted">Correo</dt>
                <dd className="font-mono text-text-primary">{credenciales.email}</dd>
              </div>
              <motion.div>
                <dt className="text-text-muted">Contraseña</dt>
                <dd className="font-mono text-accent-cyan">{credenciales.password}</dd>
              </motion.div>
            </dl>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCredenciales(null)}>
                Cerrar
              </Button>
              <Button type="button" onClick={copiarCredenciales}>
                <Copy size={16} />
                Copiar credenciales
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
