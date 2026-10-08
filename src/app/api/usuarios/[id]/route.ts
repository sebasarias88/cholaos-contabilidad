import { NextResponse } from 'next/server'
import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUuid, isValidPassword, PASSWORD_MIN } from '@/lib/validators'
import type { Usuario } from '@/types'

const CAMPOS_USUARIO = 'id, nombre, rol, activo, created_at'
const BLOQUEO_INDEFINIDO = '876000h' // ~100 años

/**
 * PUT /api/usuarios/[id] — body parcial { nombre?, activo?, password? }
 * - El admin puede cambiar su propio nombre, pero no desactivarse.
 * - password: restablece la contraseña de un empleado.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!isUuid(id)) return jsonError('Usuario no encontrado', 404)

  const body = await leerJson(request)
  if (!body) return jsonError('Body inválido', 400)

  const { supabase, user } = auth.ctx
  const { data: objetivo } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', id)
    .maybeSingle()
  if (!objetivo) return jsonError('Usuario no encontrado', 404)

  const esPropio = id === user.id
  if (objetivo.rol === 'admin' && !esPropio) {
    return jsonError('No se puede modificar la cuenta del admin', 403)
  }

  const update: Record<string, unknown> = {}
  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).trim().slice(0, 80)
    if (!nombre) return jsonError('El nombre es requerido', 400)
    update.nombre = nombre
  }
  if (body.activo !== undefined) {
    if (esPropio) return jsonError('No puedes desactivar tu propia cuenta', 400)
    update.activo = Boolean(body.activo)
  }

  const password = body.password !== undefined ? String(body.password) : null
  if (password !== null) {
    if (esPropio) return jsonError('Cambia tu contraseña desde Mi cuenta', 400)
    if (!isValidPassword(password)) {
      return jsonError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`, 400)
    }
  }

  if (Object.keys(update).length === 0 && password === null) {
    return jsonError('Sin campos válidos', 400)
  }

  const admin = createAdminClient()

  // Cambios en Auth: contraseña y bloqueo de sesión al desactivar
  const cambiosAuth: { password?: string; ban_duration?: string } = {}
  if (password !== null) cambiosAuth.password = password
  if (update.activo !== undefined) {
    cambiosAuth.ban_duration = update.activo ? 'none' : BLOQUEO_INDEFINIDO
  }
  if (Object.keys(cambiosAuth).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(id, cambiosAuth)
    if (error) return jsonError(error.message || 'No se pudo actualizar la cuenta', 400)
  }

  let usuario: Usuario | null = null
  if (Object.keys(update).length > 0) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(update)
      .eq('id', id)
      .select(CAMPOS_USUARIO)
      .single()
    if (error) return jsonError(error.message, 400)
    usuario = data as Usuario
  } else {
    const { data } = await supabase.from('usuarios').select(CAMPOS_USUARIO).eq('id', id).single()
    usuario = data as Usuario
  }

  return NextResponse.json(usuario)
}

/** DELETE — elimina la cuenta (solo empleados sin cierres ni ventas). */
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!isUuid(id)) return jsonError('Usuario no encontrado', 404)

  const { supabase, user } = auth.ctx
  if (id === user.id) return jsonError('No puedes eliminar tu propia cuenta', 400)

  const { data: objetivo } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', id)
    .maybeSingle()

  const admin = createAdminClient()

  if (objetivo) {
    if (objetivo.rol === 'admin') {
      return jsonError('No se puede eliminar la cuenta del admin', 403)
    }

    const [ventas, cierres] = await Promise.all([
      supabase.from('ventas').select('id', { count: 'exact', head: true }).eq('usuario_id', id),
      supabase.from('cierres_dia').select('id', { count: 'exact', head: true }).eq('usuario_id', id),
    ])
    if (ventas.error || cierres.error) {
      return jsonError((ventas.error ?? cierres.error)!.message, 500)
    }
    if ((ventas.count ?? 0) > 0 || (cierres.count ?? 0) > 0) {
      return jsonError(
        'No se puede eliminar: esta cuenta tiene cierres registrados. Desactívala para bloquear el acceso.',
        409
      )
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return jsonError(error.message || 'No se pudo eliminar la cuenta', 400)

  return NextResponse.json({ ok: true })
}
