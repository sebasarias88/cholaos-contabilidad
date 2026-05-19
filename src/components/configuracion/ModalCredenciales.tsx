'use client'

import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export type CredencialesEmpleado = {
  email: string
  password: string
  nombre: string
}

interface ModalCredencialesProps {
  credenciales: CredencialesEmpleado | null
  onClose: () => void
}

export function ModalCredenciales({
  credenciales,
  onClose,
}: ModalCredencialesProps) {
  async function copiarTodo() {
    if (!credenciales) return
    const texto = `Cholao Oscar — acceso al sistema
Nombre: ${credenciales.nombre}
Correo: ${credenciales.email}
Contraseña: ${credenciales.password}
Entra en: ${window.location.origin}/login`
    try {
      await navigator.clipboard.writeText(texto)
      toast.success('Credenciales copiadas')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  async function copiarPassword() {
    if (!credenciales) return
    try {
      await navigator.clipboard.writeText(credenciales.password)
      toast.success('Contraseña copiada')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <Modal
      open={!!credenciales}
      onClose={onClose}
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
              <dt className="text-text-muted">Nombre</dt>
              <dd className="text-text-primary">{credenciales.nombre}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Correo</dt>
              <dd className="font-mono text-text-primary">{credenciales.email}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Contraseña</dt>
              <dd className="flex items-center justify-between gap-2">
                <span className="font-mono text-accent-cyan">
                  {credenciales.password}
                </span>
                <button
                  type="button"
                  onClick={copiarPassword}
                  className="focus-ring-cyan rounded-[var(--radius-md)] p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                  aria-label="Copiar contraseña"
                >
                  <Copy size={14} />
                </button>
              </dd>
            </div>
          </dl>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="button" onClick={copiarTodo}>
              <Copy size={16} />
              Copiar credenciales
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
