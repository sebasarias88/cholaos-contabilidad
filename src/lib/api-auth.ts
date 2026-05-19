import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

type AdminApiContext = {
  supabase: SupabaseClient
  user: User
}

type AdminApiResult =
  | { ok: true; ctx: AdminApiContext }
  | { ok: false; response: NextResponse }

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
