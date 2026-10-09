import { requireAdminApi } from '@/lib/api-auth'
import { ensureTallaProducto } from '@/lib/ensure-talla-producto'
import { NextResponse } from 'next/server'
import type { ProductoUpdateInput, TipoProducto } from '@/types'

const TIPOS: TipoProducto[] = ['vaso', 'comida', 'insumo', 'masa']

function normalizarUpdate(body: ProductoUpdateInput) {
  const patch: Record<string, unknown> = {}

  if (body.nombre !== undefined) {
    const nombre = body.nombre.trim()
    if (!nombre) return { error: 'El nombre es requerido' as const }
    patch.nombre = nombre
  }

  if (body.descripcion !== undefined) {
    patch.descripcion =
      typeof body.descripcion === 'string' ? body.descripcion.trim() || null : null
  }

  if (body.activo !== undefined) {
    patch.activo = body.activo
  }

  if (body.tipo !== undefined) {
    if (!TIPOS.includes(body.tipo)) {
      return { error: 'Tipo de producto inválido' as const }
    }
    patch.tipo = body.tipo
  }

  if (body.unidad !== undefined) {
    patch.unidad = typeof body.unidad === 'string' ? body.unidad.trim() || null : null
  }

  if (body.onzas !== undefined) {
    patch.onzas =
      body.onzas === null || Number.isNaN(Number(body.onzas)) ? null : Number(body.onzas)
  }

  if (body.precio !== undefined) {
    if (body.precio === null) {
      patch.precio = null
    } else {
      const precio = Number(body.precio)
      if (Number.isNaN(precio) || precio < 0) {
        return { error: 'Precio inválido' as const }
      }
      patch.precio = precio
    }
  }

  if (body.tiene_variantes !== undefined) {
    patch.tiene_variantes = Boolean(body.tiene_variantes)
    if (body.tiene_variantes && body.precio === undefined) {
      patch.precio = null
    }
  }

  if (body.conteo_inventario !== undefined) {
    patch.conteo_inventario = Boolean(body.conteo_inventario)
  }
  if (body.es_adicion !== undefined) {
    patch.es_adicion = Boolean(body.es_adicion)
  }
  if (body.unidades_por_caja !== undefined) {
    const n = Number(body.unidades_por_caja)
    patch.unidades_por_caja = body.unidades_por_caja !== null && n > 0 ? Math.floor(n) : null
  }
  if (body.lleva_masas !== undefined) {
    patch.lleva_masas = Boolean(body.lleva_masas)
  }

  if (body.talla_id !== undefined) {
    patch.talla_id = typeof body.talla_id === 'string' && body.talla_id ? body.talla_id : null
  }

  // Si se cambia a insumo o masa vía payload completo, forzar precio null
  if ((body.tipo === 'insumo' || body.tipo === 'masa') && body.precio === undefined) {
    patch.precio = null
  }
  // Solo la comida sin variantes se puede contar como los vasos
  if ((body.tipo !== undefined && body.tipo !== 'comida') || body.tiene_variantes === true) {
    patch.conteo_inventario = false
    patch.es_adicion = false
  }
  if (body.tipo !== undefined && body.tipo !== 'insumo') patch.unidades_por_caja = null
  if (body.tipo !== undefined && body.tipo !== 'masa') patch.lleva_masas = false
  if (body.tipo === 'vaso' && body.unidad === undefined) {
    patch.unidad = null
  }
  if (body.tipo !== undefined && body.tipo !== 'vaso' && body.onzas === undefined) {
    patch.onzas = null
  }

  return { patch }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { supabase } = auth.ctx

  const { id } = await params
  let body: ProductoUpdateInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = normalizarUpdate(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  if (Object.keys(parsed.patch).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data: actual } = await supabase
    .from('productos')
    .select('id, nombre, tipo, onzas, talla_id')
    .eq('id', id)
    .single()

  if (!actual) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('productos')
    .update(parsed.patch)
    .eq('id', id)
    .select('*, talla:tallas_vasos(*), variantes:variantes_producto(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const tipoFinal = (parsed.patch.tipo ?? actual.tipo) as TipoProducto
  if (tipoFinal === 'vaso') {
    const onzasFinal = Number(parsed.patch.onzas ?? data.onzas)
    const tallaIdFinal =
      body.talla_id !== undefined ? body.talla_id : (data.talla_id as string | null)
    const bodyExtra = body as ProductoUpdateInput & {
      tipo_vaso?: string
      talla_descripcion?: string | null
      crear_talla?: boolean
    }
    const linked = await ensureTallaProducto(supabase, {
      productoId: id,
      onzas: onzasFinal,
      tallaId: bodyExtra.crear_talla ? null : tallaIdFinal,
      tipoVaso: bodyExtra.tipo_vaso as 'normal' | 'ancho' | 'angosto' | undefined,
      descripcionTalla: bodyExtra.talla_descripcion,
    })
    if (linked.error) {
      return NextResponse.json({ error: linked.error }, { status: 400 })
    }
    const { data: refreshed, error: refreshError } = await supabase
      .from('productos')
      .select('*, talla:tallas_vasos(*), variantes:variantes_producto(*)')
      .eq('id', id)
      .single()
    if (refreshError) {
      return NextResponse.json({ error: refreshError.message }, { status: 400 })
    }
    return NextResponse.json(refreshed)
  }

  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const { supabase } = auth.ctx

  const { data: producto } = await supabase
    .from('productos')
    .select('id, nombre')
    .eq('id', id)
    .single()

  if (!producto) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const { count: usos, error: countErr } = await supabase
    .from('detalle_ventas')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id)

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 })
  }

  if ((usos ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          'No se puede eliminar: este producto aparece en ventas registradas. Desactívalo para ocultarlo.',
      },
      { status: 409 }
    )
  }

  // Conteos de cierre
  const { count: conteos } = await supabase
    .from('conteo_vasos')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id)

  if ((conteos ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          'No se puede eliminar: este producto aparece en cierres. Desactívalo para ocultarlo.',
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('productos').delete().eq('id', id)

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('foreign key') || msg.includes('violates')) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar: el producto está en uso. Desactívalo para ocultarlo.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
