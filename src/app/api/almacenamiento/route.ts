import { jsonError, requireAdminApi } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

/** GET /api/almacenamiento — tamaño de la BD, por tabla e historial (admin) */
export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.ctx.supabase.rpc('uso_almacenamiento')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
