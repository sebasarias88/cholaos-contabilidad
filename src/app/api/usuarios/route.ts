import { NextResponse } from 'next/server'
import { jsonError, leerJson, requireAdminApi } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidEmail, isValidPassword, PASSWORD_MIN } from '@/lib/validators'
import type { CrearEmpleadoResponse, Usuario } from '@/types'

const CAMPOS_USUARIO = 'id, nombre, rol, activo, created_at'

/** Mapa id → email desde Auth (solo admin) */
async function emailsPorId(): Promise<Map<string, string>> {
  const admin = createAdminClient()
  const mapa = new Map<string, string>()
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data) break
    for (const u of data.users) if (u.email) mapa.set(u.id, u.email)
    if (data.users.length < 200) break
  }
  return mapa
}

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.ctx.supabase
    .from('usuarios')
    .select(CAMPOS_USUARIO)
    .order('created_at', { ascending: false })

  if (error) return jsonError(error.message, 500)

  const emails = await emailsPorId()
  const usuarios: Usuario[] = (data ?? []).map((u) => ({
    ...(u as Usuario),
    email: emails.get(u.id),
  }))
  return NextResponse.json(usuarios)
}

function traducirErrorAuth(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('already') && (m.includes('registered') || m.includes('exists'))) {
    return 'Ya existe una cuenta con ese correo'
  }
  if (m.includes('password')) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`
  }
  if (m.includes('email')) return 'El correo no es válido'
  return mensaje
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await leerJson(request)
  if (!body) return jsonError('Body inválido', 400)

  const email = String(body.email ?? '').trim().toLowerCase()
  const nombre = String(body.nombre ?? '').trim().slice(0, 80)
  const password = String(body.password ?? '')

  if (!nombre) return jsonError('El nombre es requerido', 400)
  if (!isValidEmail(email)) return jsonError('Ingresa un correo válido', 400)
  if (!isValidPassword(password)) {
    return jsonError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`, 400)
  }

  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  })

  if (authError || !authData.user) {
    return jsonError(traducirErrorAuth(authError?.message ?? 'No se pudo crear la cuenta'), 400)
  }

  // El perfil se crea explícitamente (no dependemos solo del trigger)
  const { data: perfil, error: perfilError } = await admin
    .from('usuarios')
    .upsert(
      { id: authData.user.id, nombre, rol: 'empleado', activo: true },
      { onConflict: 'id' }
    )
    .select(CAMPOS_USUARIO)
    .single()

  if (perfilError || !perfil) {
    // Revertir para no dejar cuentas huérfanas
    await admin.auth.admin.deleteUser(authData.user.id)
    return jsonError('No se pudo crear el perfil del empleado. Intenta de nuevo.', 500)
  }

  const respuesta: CrearEmpleadoResponse = {
    mensaje: 'Empleado creado correctamente',
    usuario: { ...(perfil as Usuario), email },
  }
  return NextResponse.json(respuesta, { status: 201 })
}
