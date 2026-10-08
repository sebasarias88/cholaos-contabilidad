'use client'

import { Check, X } from 'lucide-react'
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

function EstadoUsuario({ activo }: { activo: boolean }) {
  if (activo) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <Check size={14} className="text-accent-green shrink-0" />
        <span className="text-accent-green">Activo</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <X size={14} className="text-accent-red shrink-0" />
      <span className="text-accent-red">Inactivo</span>
    </span>
  )
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
    <>
      {/* Vista móvil: tarjetas */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filas.map((u) => (
          <li
            key={u.id}
            className="border-bg-border bg-bg-surface overflow-hidden rounded-[var(--radius-lg)] border"
          >
            <div className="flex items-start gap-2 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-text-primary leading-snug font-medium">
                  {u.nombre}
                  {u.esYo && (
                    <span className="text-text-muted ml-1.5 text-xs font-normal">(tú)</span>
                  )}
                </p>
                {u.email && (
                  <p className="text-text-secondary mt-0.5 truncate text-xs">{u.email}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={u.rol === 'admin' ? 'admin' : 'empleado'}>
                    {u.rol === 'admin' ? 'Admin' : 'Empleado'}
                  </Badge>
                  <EstadoUsuario activo={u.activo} />
                </div>
              </div>
              {u.rol === 'empleado' && (
                <BotonAcciones abierto={menuAbierto === u.id} onClick={(e) => onToggleMenu(u, e)} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Vista escritorio: tabla */}
      <div className="table-surface hidden max-w-full min-w-0 md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-name">Nombre</th>
              <th className="col-compact min-w-[5.5rem]">Rol</th>
              <th className="col-compact min-w-[5.5rem]">Estado</th>
              <th className="col-compact min-w-[4.5rem] text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((u) => (
              <tr key={u.id}>
                <td className="col-name text-text-primary font-medium">
                  {u.nombre}
                  {u.esYo && <span className="text-text-muted ml-2 text-xs font-normal">(tú)</span>}
                  {u.email && <p className="text-text-secondary text-xs font-normal">{u.email}</p>}
                </td>
                <td className="col-compact">
                  <Badge variant={u.rol === 'admin' ? 'admin' : 'empleado'}>
                    {u.rol === 'admin' ? 'Admin' : 'Empleado'}
                  </Badge>
                </td>
                <td className="col-compact">
                  <EstadoUsuario activo={u.activo} />
                </td>
                <td className="col-compact text-right">
                  {u.rol === 'empleado' && (
                    <BotonAcciones
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
