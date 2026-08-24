import { CIERRE_SELECT, sanitizarCierreParaEmpleado } from '@/lib/cierres-api'
import { requireAuthApi } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CierreDia, TipoProducto } from '@/types'

// GET — obtener cierre de una fecha o listado
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  const esAdmin = miUsuario?.rol === 'admin'

  const tieneRango = Boolean(desde || hasta)

  if (!esAdmin) {
    if (tieneRango) {
      return NextResponse.json(
        { error: 'Solo el admin puede listar cierres por rango' },
        { status: 403 }
      )
    }
    if (!fecha) {
      return NextResponse.json(
        { error: 'Indica fecha=YYYY-MM-DD' },
        { status: 400 }
      )
    }
  } else if (!fecha && (!desde || !hasta)) {
    return NextResponse.json(
      { error: 'Indica fecha=YYYY-MM-DD o desde y hasta' },
      { status: 400 }
    )
  }

  let query = supabase
    .from('cierres_dia')
    .select(CIERRE_SELECT)
    .order('fecha', { ascending: false })

  if (fecha) query = query.eq('fecha', fecha)
  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filas = (data ?? []) as CierreDia[]

  if (!esAdmin) {
    const uno = filas[0]
    if (!uno) {
      return NextResponse.json(
        { error: 'No hay cierre para esa fecha' },
        { status: 404 }
      )
    }
    return NextResponse.json(sanitizarCierreParaEmpleado(uno))
  }

  return NextResponse.json(fecha ? (filas[0] ?? null) : filas)
}

type GastoBody = { descripcion?: string; monto?: number }
type TransferenciaBody = { descripcion?: string; monto?: number }
type NovedadVasoBody = {
  motivo_id?: string
  motivo_custom?: string
  cantidad?: number
}
type ConteoProductoBody = {
  talla_id?: string
  producto_id?: string
  tipo?: TipoProducto
  cantidad_inicio?: number
  cantidad_nuevos?: number
  cantidad_final?: number
  observacion?: string | null
  novedades?: NovedadVasoBody[]
  precio_unitario?: number
}

type VentaVarianteBody = {
  variante_id?: string
  cantidad?: number
  precio_unitario?: number
}

type VentaComidaBody = {
  producto_id?: string
  cantidad?: number
  precio_unitario?: number
}

function asArray<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : []
}

function vendidosDesdeConteo(c: ConteoProductoBody): number {
  const gastados =
    (Number(c.cantidad_inicio) || 0) +
    (Number(c.cantidad_nuevos) || 0) -
    (Number(c.cantidad_final) || 0)
  const novedadesTotal = (c.novedades ?? []).reduce(
    (s, n) => s + (Number(n.cantidad) || 0),
    0
  )
  return Math.max(0, gastados - novedadesTotal)
}

function calcularTotalVentas(conteos: ConteoProductoBody[]): number {
  let total = 0
  for (const c of conteos) {
    // Comida ya no va por conteo; solo vasos (insumos no venden)
    if (c.tipo !== 'vaso') continue
    if (!c.precio_unitario) continue
    if (!c.talla_id && !c.producto_id) continue
    total += vendidosDesdeConteo(c) * Number(c.precio_unitario)
  }
  return total
}

// POST — cerrar el día (admin o empleado; definitivo en un solo paso)
export async function POST(request: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const { user } = auth.ctx
  const supabase = createAdminClient()

  let raw: Record<string, unknown>
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const fecha = typeof raw.fecha === 'string' ? raw.fecha : ''
  const dinero_base_inicio = Number(raw.dinero_base_inicio) || 0
  const dinero_final = Number(raw.dinero_final) || 0
  const observaciones =
    typeof raw.observaciones === 'string' && raw.observaciones.trim()
      ? raw.observaciones.trim()
      : null

  const gastos = asArray<GastoBody>(raw.gastos)
  const transferencias = asArray<TransferenciaBody>(raw.transferencias)
  const conteoProductos = asArray<ConteoProductoBody>(raw.conteo_productos)
  const ventas_variantes = asArray<VentaVarianteBody>(raw.ventas_variantes)
  const ventas_comida = asArray<VentaComidaBody>(raw.ventas_comida)

  if (!fecha) {
    return NextResponse.json({ error: 'La fecha es requerida' }, { status: 400 })
  }

  const total_gastos = gastos.reduce((s, g) => s + (Number(g?.monto) || 0), 0)
  const total_transferencias = transferencias.reduce(
    (s, t) => s + (Number(t?.monto) || 0),
    0
  )
  const total_ventas_vasos = calcularTotalVentas(conteoProductos)
  const total_ventas_variantes = ventas_variantes.reduce(
    (s, v) =>
      s + (Number(v.cantidad) || 0) * (Number(v.precio_unitario) || 0),
    0
  )
  const total_ventas_comida = ventas_comida.reduce(
    (s, v) =>
      s + (Number(v.cantidad) || 0) * (Number(v.precio_unitario) || 0),
    0
  )
  const total_ventas =
    total_ventas_vasos + total_ventas_variantes + total_ventas_comida

  const { data: cierreExistente } = await supabase
    .from('cierres_dia')
    .select('id, estado')
    .eq('fecha', fecha)
    .maybeSingle()

  if (cierreExistente?.estado === 'cerrado') {
    return NextResponse.json(
      { error: 'Este día ya fue cerrado definitivamente' },
      { status: 400 }
    )
  }

  const datosCierre = {
    dinero_base_inicio,
    dinero_final,
    total_gastos,
    total_transferencias,
    total_ventas,
    observaciones,
    estado: 'cerrado' as const,
  }

  let cierre_id: string

  if (cierreExistente) {
    const { data, error } = await supabase
      .from('cierres_dia')
      .update(datosCierre)
      .eq('id', cierreExistente.id)
      .select('id')
      .single()

    if (error) {
      console.error('[POST /api/cierres] update cierres_dia:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    cierre_id = data.id

    await supabase.from('gastos_dia').delete().eq('cierre_id', cierre_id)
    await supabase.from('transferencias_dia').delete().eq('cierre_id', cierre_id)
    // novedades_vasos se eliminan en cascada al borrar conteo_vasos
    await supabase.from('conteo_vasos').delete().eq('cierre_id', cierre_id)
    await supabase.from('ventas_variantes').delete().eq('cierre_id', cierre_id)
    await supabase.from('ventas_comida').delete().eq('cierre_id', cierre_id)

    const { data: ventaExistente } = await supabase
      .from('ventas')
      .select('id')
      .eq('cierre_id', cierre_id)
      .maybeSingle()

    if (ventaExistente) {
      await supabase
        .from('detalle_ventas')
        .delete()
        .eq('venta_id', ventaExistente.id)
      await supabase.from('ventas').delete().eq('id', ventaExistente.id)
    }
  } else {
    const { data, error } = await supabase
      .from('cierres_dia')
      .insert({
        fecha,
        usuario_id: user.id,
        ...datosCierre,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[POST /api/cierres] insert cierres_dia:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    cierre_id = data.id
  }

  const gastosValidos = gastos.filter((g) => g?.descripcion?.trim())
  if (gastosValidos.length > 0) {
    const { error } = await supabase.from('gastos_dia').insert(
      gastosValidos.map((g) => ({
        cierre_id,
        descripcion: g.descripcion!.trim(),
        monto: Number(g.monto) || 0,
      }))
    )
    if (error) {
      return NextResponse.json(
        { error: `Error insertando gastos: ${error.message}` },
        { status: 400 }
      )
    }
  }

  const transValidas = transferencias.filter((t) => t?.descripcion?.trim())
  if (transValidas.length > 0) {
    const { error } = await supabase.from('transferencias_dia').insert(
      transValidas.map((t) => ({
        cierre_id,
        descripcion: t.descripcion!.trim(),
        monto: Number(t.monto) || 0,
      }))
    )
    if (error) {
      return NextResponse.json(
        { error: `Error insertando transferencias: ${error.message}` },
        { status: 400 }
      )
    }
  }

  const detalleItems: {
    producto_id: string
    cantidad: number
    precio_unitario: number
  }[] = []

  for (const c of conteoProductos) {
    if (!c.talla_id && !c.producto_id) continue

    const { data: conteoInsertado, error: errorConteo } = await supabase
      .from('conteo_vasos')
      .insert({
        cierre_id,
        talla_id: c.talla_id ?? null,
        producto_id: c.producto_id ?? null,
        cantidad_inicio: Number(c.cantidad_inicio) || 0,
        cantidad_nuevos: Number(c.cantidad_nuevos) || 0,
        cantidad_final: Number(c.cantidad_final) || 0,
        observacion: c.observacion?.trim() || null,
      })
      .select('id')
      .single()

    if (errorConteo) {
      return NextResponse.json(
        { error: `Error en conteo: ${errorConteo.message}` },
        { status: 400 }
      )
    }

    // Novedades solo para vasos
    if (c.tipo === 'vaso') {
      const novedadesValidas = (c.novedades ?? []).filter(
        (n) => n?.motivo_id && Number(n?.cantidad) > 0
      )
      if (novedadesValidas.length > 0) {
        const { error: errorNov } = await supabase
          .from('novedades_vasos')
          .insert(
            novedadesValidas.map((n) => ({
              conteo_id: conteoInsertado.id,
              motivo_id: n.motivo_id!,
              motivo_custom: n.motivo_custom?.trim() || null,
              cantidad: Number(n.cantidad),
            }))
          )

        if (errorNov) {
          return NextResponse.json(
            { error: `Error en novedades: ${errorNov.message}` },
            { status: 400 }
          )
        }
      }
    }

    // Detalle de venta si tiene producto_id y precio (vaso/comida)
    if (c.tipo !== 'insumo' && c.precio_unitario && c.producto_id) {
      const vendidos = vendidosDesdeConteo(c)
      if (vendidos > 0) {
        detalleItems.push({
          producto_id: c.producto_id,
          cantidad: vendidos,
          precio_unitario: Number(c.precio_unitario),
        })
      }
    }
  }

  // Insertar ventas de variantes
  const variantesValidas = ventas_variantes.filter(
    (v) => v?.variante_id && Number(v?.cantidad) > 0
  )
  if (variantesValidas.length > 0) {
    const { error } = await supabase.from('ventas_variantes').insert(
      variantesValidas.map((v) => ({
        cierre_id,
        variante_id: v.variante_id!,
        cantidad: Number(v.cantidad),
      }))
    )
    if (error) {
      return NextResponse.json(
        { error: `Error en ventas variantes: ${error.message}` },
        { status: 400 }
      )
    }
  }

  // Insertar ventas de comida simple
  const comidaValida = ventas_comida.filter(
    (v) => v?.producto_id && Number(v?.cantidad) > 0
  )
  if (comidaValida.length > 0) {
    const { error } = await supabase.from('ventas_comida').insert(
      comidaValida.map((v) => ({
        cierre_id,
        producto_id: v.producto_id!,
        cantidad: Number(v.cantidad),
      }))
    )
    if (error) {
      return NextResponse.json(
        { error: `Error en ventas comida: ${error.message}` },
        { status: 400 }
      )
    }
  }

  if (total_ventas > 0) {
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .insert({
        fecha,
        usuario_id: user.id,
        total: total_ventas,
        cierre_id,
      })
      .select('id')
      .single()

    if (errorVenta) {
      return NextResponse.json(
        { error: `Error creando venta: ${errorVenta.message}` },
        { status: 400 }
      )
    }

    if (detalleItems.length > 0) {
      const { error: errorDetalle } = await supabase
        .from('detalle_ventas')
        .insert(
          detalleItems.map((i) => ({
            venta_id: venta.id,
            producto_id: i.producto_id,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
          }))
        )
      if (errorDetalle) {
        return NextResponse.json(
          { error: `Error insertando detalle: ${errorDetalle.message}` },
          { status: 400 }
        )
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      cierre_id,
      estado: 'cerrado',
      total_ventas,
      total_gastos,
      total_transferencias,
    },
    { status: cierreExistente ? 200 : 201 }
  )
}
