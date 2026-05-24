import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

type AuthApiContext = {
  supabase: SupabaseClient
  user: User
}

type AuthApiResult =
  | { ok: true; ctx: AuthApiContext }
  | { ok: false; response: NextResponse }

/** Sesión activa (admin o empleado) */
export async function requireAuthApi(): Promise<AuthApiResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
  }

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  if (!miUsuario?.activo) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }),
    }
  }

  return { ok: true, ctx: { supabase, user } }
}

type AdminApiContext = AuthApiContext

type AdminApiResult = AuthApiResult

export async function requireAdminApi(): Promise<AdminApiResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
  }

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (miUsuario?.rol !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }),
    }
  }

  return { ok: true, ctx: { supabase, user } }
}
