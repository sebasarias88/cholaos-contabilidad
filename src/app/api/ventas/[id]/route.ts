import { jsonError, requireAdminApi } from '@/lib/api-auth'
import { VENTA_SELECT } from '@/lib/supabase/queries'
import { isUuid } from '@/lib/validators'
import { NextResponse } from 'next/server'

/** GET /api/ventas/[id] — solo admin. Las ventas se corrigen desde el cierre del día. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!isUuid(id)) return jsonError('Venta no encontrada', 404)

  const { data, error } = await auth.ctx.supabase
    .from('ventas')
    .select(VENTA_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) return jsonError(error.message, 500)
  if (!data) return jsonError('Venta no encontrada', 404)
  return NextResponse.json(data)
}
