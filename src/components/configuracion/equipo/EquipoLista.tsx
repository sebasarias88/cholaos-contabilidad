'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { BotonAcciones } from '@/components/ui/BotonAcciones'
import type { Usuario } from '@/types'

export type FilaEquipo = Usuario & { esYo: boolean }

export function ordenarEquipo(usuarios: Usuario[], actualId: string): FilaEquipo[] {
  const admin = usuarios.find((u) => u.rol === 'admin')
  const empleados = usuarios
    .filter((u) => u.rol === 'empleado')
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const lista = [...(admin ? [admin] : []), ...empleados]
  return lista.map((u) => ({ ...u, esYo: u.id === actualId }))
}

const COLORES_AVATAR = [
  'bg-brand-soft text-brand',
  'bg-ok-soft text-ok',
  'bg-warn-soft text-warn',
  'bg-bg-elevated text-text-primary',
]

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function EquipoLista({
  filas,
  menuAbierto,
  onToggleMenu,
}: {
  filas: FilaEquipo[]
  menuAbierto: string | null
  onToggleMenu: (u: FilaEquipo, e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  if (filas.length === 0) {
    return <p className="text-text-muted py-8 text-center text-sm">No hay usuarios en el equipo</p>
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {filas.map((u, i) => (
        <motion.li
          key={u.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: u.activo ? 1 : 0.6, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="card flex items-center gap-3 p-4"
        >
          <span
            className={`font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${
              u.rol === 'admin'
                ? 'bg-cocoa text-cocoa-text'
                : COLORES_AVATAR[i % COLORES_AVATAR.length]
            }`}
            aria-hidden
          >
            {iniciales(u.nombre)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-text-primary truncate font-bold">
              {u.nombre}
              {u.esYo && <span className="text-text-muted ml-1.5 text-xs font-semibold">(tú)</span>}
            </p>
            {u.email && <p className="text-text-muted truncate text-xs font-medium">{u.email}</p>}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={u.rol === 'admin' ? 'admin' : 'empleado'}>
                {u.rol === 'admin' ? 'Admin' : 'Empleado'}
              </Badge>
              {u.activo ? (
                <span className="text-ok inline-flex items-center gap-1 text-xs font-bold">
                  <span className="bg-ok-solid h-1.5 w-1.5 rounded-full" /> Activo
                </span>
              ) : (
                <span className="text-bad inline-flex items-center gap-1 text-xs font-bold">
                  <span className="bg-bad h-1.5 w-1.5 rounded-full" /> Inactivo
                </span>
              )}
            </div>
          </div>
          {u.rol === 'empleado' && (
            <BotonAcciones abierto={menuAbierto === u.id} onClick={(e) => onToggleMenu(u, e)} />
          )}
        </motion.li>
      ))}
    </ul>
  )
}
