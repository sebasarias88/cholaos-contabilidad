import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** GET /api/variantes?producto_id=xxx */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const producto_id = searchParams.get('producto_id')

  let query = supabase
    .from('variantes_producto')
    .select('*')
    .eq('activo', true)
    .order('orden')

  if (producto_id) query = query.eq('producto_id', producto_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
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

  const body = await request.json()
  const { data, error } = await supabase
    .from('variantes_producto')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
