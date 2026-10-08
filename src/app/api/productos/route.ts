import { requireAdminApi, requireAuthApi } from '@/lib/api-auth'
import { ensureTallaProducto } from '@/lib/ensure-talla-producto'
import { NextResponse } from 'next/server'
import type { TipoProducto } from '@/types'

const TIPOS: TipoProducto[] = ['vaso', 'comida', 'insumo']

export async function GET(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { supabase, esAdmin } = auth.ctx

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  // ?todos=true (incluye inactivos) solo para admin
  const todos = esAdmin && searchParams.get('todos') === 'true'

  let query = supabase
    .from('productos')
    .select(
      `
      *,
      talla:tallas_vasos(*),
      variantes:variantes_producto(*)
    `
    )
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  // Gestión admin: ?todos=true incluye inactivos
  if (!todos) query = query.eq('activo', true)
  if (tipo && TIPOS.includes(tipo as TipoProducto)) {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Variantes inactivas solo las ve el admin en gestión
  const productos = (data ?? []).map((p) => ({
    ...p,
    variantes: todos
      ? p.variantes
      : (p.variantes ?? []).filter((v: { activo: boolean }) => v.activo),
  }))
  return NextResponse.json(productos)
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { supabase } = auth.ctx

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre : ''
  const tipo = body.tipo as TipoProducto | undefined
  const onzas = body.onzas
  const unidad = typeof body.unidad === 'string' ? body.unidad : null
  const precio = body.precio
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion : null
  const talla_id = typeof body.talla_id === 'string' && body.talla_id ? body.talla_id : null
  const tiene_variantes = Boolean(body.tiene_variantes)

  if (!nombre.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }
  if (!tipo || !TIPOS.includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  if (tipo === 'vaso' && !onzas) {
    return NextResponse.json({ error: 'Las onzas son requeridas para vasos' }, { status: 400 })
  }
  if (
    tipo !== 'insumo' &&
    !tiene_variantes &&
    (precio === undefined || precio === null || precio === '')
  ) {
    return NextResponse.json({ error: 'El precio es requerido' }, { status: 400 })
  }
  if (tipo !== 'vaso' && !unidad?.trim()) {
    return NextResponse.json(
      { error: 'La unidad es requerida para comida e insumos' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre: nombre.trim(),
      tipo,
      onzas: tipo === 'vaso' ? Number(onzas) : null,
      unidad: tipo !== 'vaso' ? unidad!.trim() : null,
      precio: tipo === 'insumo' || tiene_variantes ? null : Number(precio),
      descripcion: descripcion?.trim() || null,
      talla_id: null,
      tiene_variantes: tipo === 'comida' ? tiene_variantes : false,
    })
    .select('*, talla:tallas_vasos(*), variantes:variantes_producto(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (tipo === 'vaso' && data) {
    const tipoVaso = typeof body.tipo_vaso === 'string' ? body.tipo_vaso : undefined
    const descripcionTalla =
      typeof body.talla_descripcion === 'string' ? body.talla_descripcion : null

    const linked = await ensureTallaProducto(supabase, {
      productoId: data.id,
      onzas: Number(onzas),
      tallaId: talla_id,
      tipoVaso: tipoVaso as 'normal' | 'ancho' | 'angosto' | undefined,
      descripcionTalla,
    })
    if (linked.error) {
      return NextResponse.json({ error: linked.error }, { status: 400 })
    }
    const { data: refreshed, error: refreshError } = await supabase
      .from('productos')
      .select('*, talla:tallas_vasos(*), variantes:variantes_producto(*)')
      .eq('id', data.id)
      .single()
    if (refreshError) {
      return NextResponse.json({ error: refreshError.message }, { status: 400 })
    }
    return NextResponse.json(refreshed, { status: 201 })
  }

  return NextResponse.json(data, { status: 201 })
}
