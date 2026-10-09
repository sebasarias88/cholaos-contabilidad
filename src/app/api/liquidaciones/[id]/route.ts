import { requireAdminApi } from '@/lib/api-auth'
import { respuestaErrorRpc } from '@/lib/cierre/api'
import { NextResponse } from 'next/server'

/** DELETE — deshace una liquidación: sus descuentos vuelven a quedar pendientes */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { error } = await auth.ctx.supabase.rpc('deshacer_liquidacion', { p_id: id })
  if (error) return respuestaErrorRpc(error)
  return NextResponse.json({ ok: true })
}
