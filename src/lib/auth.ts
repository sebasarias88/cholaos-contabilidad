import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Usuario } from '@/types'

/** Usuario de Auth de la petición actual (deduplicado por request) */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

/** Perfil en public.usuarios (deduplicado por request: layout + page) */
export const getMiUsuario = cache(async (): Promise<Usuario | null> => {
  const user = await getSession()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo, created_at')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Usuario | null) ?? null
})

/** Rutas del dashboard — requiere sesión y cuenta activa */
export async function requireAuth(): Promise<Usuario> {
  const usuario = await getMiUsuario()
  if (!usuario || !usuario.activo) redirect('/login')
  return usuario
}

/** Rutas solo admin (productos, reportes, configuración, historiales) */
export async function requireAdmin(): Promise<Usuario> {
  const usuario = await requireAuth()
  if (usuario.rol !== 'admin') redirect('/dashboard/cierre')
  return usuario
}
