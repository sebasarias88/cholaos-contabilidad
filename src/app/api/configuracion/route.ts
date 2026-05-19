import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'
import type { ConfiguracionNegocio, ConfiguracionNegocioInput } from '@/types'

const CONFIG_ID = 1

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx
  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('nombre_negocio, updated_at')
    .eq('id', CONFIG_ID)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as ConfiguracionNegocio)
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { nombre_negocio } = (await request.json()) as ConfiguracionNegocioInput
  const nombre = String(nombre_negocio ?? '').trim()

  if (!nombre) {
    return NextResponse.json(
      { error: 'El nombre del negocio es requerido' },
      { status: 400 }
    )
  }

  const { supabase } = auth.ctx
  const { data, error } = await supabase
    .from('configuracion_negocio')
    .update({ nombre_negocio: nombre, updated_at: new Date().toISOString() })
    .eq('id', CONFIG_ID)
    .select('nombre_negocio, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data as ConfiguracionNegocio)
}
