import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** PUT /api/variantes/[id] — actualizar variante (admin) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  if (miUsuario?.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('variantes_producto')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

/** DELETE /api/variantes/[id] — soft delete (admin) */
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  if (miUsuario?.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabase
    .from('variantes_producto')
    .update({ activo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
