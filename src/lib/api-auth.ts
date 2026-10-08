import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Rol } from '@/types'

export type AuthApiContext = {
  supabase: SupabaseClient
  user: User
  rol: Rol
  esAdmin: boolean
}

type AuthApiResult =
  | { ok: true; ctx: AuthApiContext }
  | { ok: false; response: NextResponse }

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

/** Sesión activa (admin o empleado activo) */
export async function requireAuthApi(): Promise<AuthApiResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: jsonError('No autenticado', 401) }
  }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol, activo')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil?.activo) {
    return { ok: false, response: jsonError('No autorizado', 403) }
  }

  const rol = perfil.rol as Rol
  return { ok: true, ctx: { supabase, user, rol, esAdmin: rol === 'admin' } }
}

/** Solo admin activo */
export async function requireAdminApi(): Promise<AuthApiResult> {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth
  if (!auth.ctx.esAdmin) {
    return { ok: false, response: jsonError('No autorizado', 403) }
  }
  return auth
}

/** Lee JSON del body sin lanzar */
export async function leerJson<T = Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    const data = await request.json()
    return data && typeof data === 'object' ? (data as T) : null
  } catch {
    return null
  }
}
