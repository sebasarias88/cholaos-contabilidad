import { getMiUsuario, getSession } from '@/lib/auth'
import { requireAuthApi } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'
import { isValidPassword } from '@/lib/validators'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getSession()

  if (!user) {
    return NextResponse.json({ user: null, usuario: null })
  }

  const usuario = await getMiUsuario()

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    usuario,
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string
    password?: string
  }

  const email = body.email?.trim()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Completa correo y contraseña' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas' },
      { status: 401 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas' },
      { status: 401 }
    )
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('activo')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'No se encontró tu perfil. Contacta al administrador.' },
      { status: 403 }
    )
  }

  if (!perfil.activo) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Tu cuenta está desactivada. Contacta al admin.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const { supabase, user } = auth.ctx
  const body = (await request.json()) as {
    passwordActual?: string
    passwordNueva?: string
  }

  const passwordActual = body.passwordActual ?? ''
  const passwordNueva = body.passwordNueva ?? ''

  if (!passwordActual || !passwordNueva) {
    return NextResponse.json(
      { error: 'Completa todos los campos de contraseña' },
      { status: 400 }
    )
  }

  if (!isValidPassword(passwordNueva)) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
      { status: 400 }
    )
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Usuario sin correo' }, { status: 400 })
  }

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: passwordActual,
  })

  if (loginError) {
    return NextResponse.json(
      { error: 'La contraseña actual es incorrecta' },
      { status: 401 }
    )
  }

  const { error } = await supabase.auth.updateUser({ password: passwordNueva })

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Error al cambiar contraseña' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
