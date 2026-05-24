/**
 * @deprecated El cierre definitivo se hace en un solo paso con POST /api/cierres (estado = cerrado).
 * Este endpoint se mantiene por compatibilidad y solo marca cerrado si aún está en borrador.
 */
import { requireAdminApi } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const supabase = createAdminClient()

  const { data: existente, error: fetchError } = await supabase
    .from('cierres_dia')
    .select('id, estado')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existente) {
    console.error('[POST /api/cierres/[id]/cerrar] cierre no encontrado:', fetchError)
    return NextResponse.json({ error: 'Cierre no encontrado' }, { status: 404 })
  }

  if (existente.estado === 'cerrado') {
    return NextResponse.json({
      ok: true,
      mensaje: 'El día ya estaba cerrado',
      id: existente.id,
      estado: 'cerrado',
    })
  }

  const { data, error } = await supabase
    .from('cierres_dia')
    .update({ estado: 'cerrado' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/cierres/[id]/cerrar] update:', {
      id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
