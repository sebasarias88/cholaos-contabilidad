import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CrearEmpleadoInput, CrearEmpleadoResponse, Usuario } from '@/types'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as Usuario[])
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { email, nombre, password } = (await request.json()) as CrearEmpleadoInput

  if (!email || !nombre || !password) {
    return NextResponse.json(
      { error: 'Email, nombre y contraseña son requeridos' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password: String(password),
    email_confirm: true,
    user_metadata: { nombre: String(nombre).trim(), rol: 'empleado' },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { supabase } = auth.ctx
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo, created_at')
    .eq('id', authData.user.id)
    .single()

  const usuario: Usuario =
    perfil ?? {
      id: authData.user.id,
      nombre: String(nombre).trim(),
      rol: 'empleado',
      activo: true,
      created_at: new Date().toISOString(),
    }

  const body: CrearEmpleadoResponse = {
    mensaje: 'Empleado creado correctamente',
    usuario,
  }

  return NextResponse.json(body, { status: 201 })
}
