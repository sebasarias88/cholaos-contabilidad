import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Rol, Usuario } from '@/types'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getMiUsuario(): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function requireRol(rol: Rol) {
  const usuario = await getMiUsuario()
  if (!usuario || usuario.rol !== rol) {
    throw new Error('No autorizado')
  }
  return usuario
}

/** Rutas del dashboard — requiere sesión activa */
export async function requireAuth(): Promise<Usuario> {
  const usuario = await getMiUsuario()
  if (!usuario || !usuario.activo) redirect('/login')
  return usuario
}

/** Rutas solo admin (productos, reportes, configuración) */
export async function requireAdmin(): Promise<Usuario> {
  const usuario = await requireAuth()
  if (usuario.rol !== 'admin') redirect('/dashboard/cierre')
  return usuario
}
