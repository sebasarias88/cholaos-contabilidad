import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Usuario, UsuarioUpdateInput } from '@/types'

const CAMPOS_PERMITIDOS = ['nombre', 'activo'] as const

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = (await request.json()) as UsuarioUpdateInput
  const { supabase } = auth.ctx

  const { data: objetivo } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', id)
    .single()

  if (!objetivo) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const esPropioPerfil = id === auth.ctx.user.id

  if (objetivo.rol === 'admin' && !esPropioPerfil) {
    return NextResponse.json(
      { error: 'No se puede modificar la cuenta del admin' },
      { status: 403 }
    )
  }

  const update: Record<string, unknown> = {}
  for (const key of CAMPOS_PERMITIDOS) {
    if (key in body) update[key] = body[key]
  }

  if (esPropioPerfil && objetivo.rol === 'admin') {
    delete update.activo
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 })
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(update)
    .eq('id', id)
    .select('id, nombre, rol, activo, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data as Usuario)
}

/** Elimina la cuenta de Auth (cascade a usuarios). No aplica a admin ni a uno mismo. */
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const { supabase, user } = auth.ctx

  if (id === user.id) {
    return NextResponse.json(
      { error: 'No puedes eliminar tu propia cuenta' },
      { status: 400 }
    )
  }

  const { data: objetivo } = await supabase
    .from('usuarios')
    .select('rol, nombre')
    .eq('id', id)
    .single()

  if (!objetivo) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (objetivo.rol === 'admin') {
    return NextResponse.json(
      { error: 'No se puede eliminar la cuenta del admin' },
      { status: 403 }
    )
  }

  const { count: ventasCount, error: ventasErr } = await supabase
    .from('ventas')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', id)

  if (ventasErr) {
    return NextResponse.json({ error: ventasErr.message }, { status: 500 })
  }

  const { count: cierresCount } = await supabase
    .from('cierres')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', id)
  // Si la tabla cierres no existe o falla, no bloqueamos por eso; ventas sí.

  if ((ventasCount ?? 0) > 0 || (cierresCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          'No se puede eliminar: esta cuenta tiene ventas o cierres registrados. Desactívala para bloquear el acceso.',
      },
      { status: 409 }
    )
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY para eliminar cuentas' },
      { status: 500 }
    )
  }

  const admin = createAdminClient()
  const { error: authError } = await admin.auth.admin.deleteUser(id)

  if (authError) {
    return NextResponse.json(
      { error: authError.message || 'No se pudo eliminar la cuenta' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
