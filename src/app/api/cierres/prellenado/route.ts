// GET /api/cierres/prellenado — sin params; pre-llena el formulario de hoy
import { CIERRE_SELECT, sanitizarCierreParaEmpleado } from '@/lib/cierres-api'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'
import type {
  CierreDia,
  ConteoProductoPrellenado,
  PrellenadoNuevo,
  Producto,
  TipoProducto,
} from '@/types'

type ConteoAyer = {
  talla_id?: string | null
  producto_id?: string | null
  cantidad_final: number
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: miUsuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  const esAdmin = miUsuario?.rol === 'admin'

  const ayer = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const hoy = format(new Date(), 'yyyy-MM-dd')

  const { data: cierreHoy } = await supabase
    .from('cierres_dia')
    .select(CIERRE_SELECT)
    .eq('fecha', hoy)
    .maybeSingle()

  if (cierreHoy?.estado === 'cerrado') {
    const cierre = cierreHoy as CierreDia
    return NextResponse.json({
      tipo: 'cierre_existente',
      cierre: esAdmin ? cierre : sanitizarCierreParaEmpleado(cierre),
    })
  }

  const { data: cierreAyer } = await supabase
    .from('cierres_dia')
    .select(
      'dinero_final, conteo_vasos:conteo_vasos(talla_id, producto_id, cantidad_final)'
    )
    .eq('fecha', ayer)
    .maybeSingle()

  const conteoAyer = (cierreAyer?.conteo_vasos ?? []) as ConteoAyer[]

  const { data: productosData } = await supabase
    .from('productos')
    .select('*, talla:tallas_vasos(*)')
    .eq('activo', true)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  const productos = (productosData ?? []) as Producto[]

  const conteo_productos: ConteoProductoPrellenado[] = productos.map(
    (producto) => {
      const tipo = (producto.tipo ?? 'vaso') as TipoProducto
      let cantidadInicio = 0

      if (tipo === 'vaso' && producto.talla_id) {
        const conteo = conteoAyer.find((c) => c.talla_id === producto.talla_id)
        cantidadInicio = conteo?.cantidad_final ?? 0
      } else {
        const conteo = conteoAyer.find((c) => c.producto_id === producto.id)
        cantidadInicio = conteo?.cantidad_final ?? 0
      }

      return {
        producto_id: producto.id,
        talla_id: producto.talla_id ?? null,
        tipo,
        producto,
        cantidad_inicio: cantidadInicio,
        cantidad_nuevos: 0,
        cantidad_final: 0,
        observacion: '',
        novedades: [],
        precio_unitario: producto.precio ?? 0,
      }
    }
  )

  const prellenado: PrellenadoNuevo = {
    tipo: 'nuevo',
    dinero_base_inicio: cierreAyer?.dinero_final ?? 0,
    conteo_productos,
  }

  return NextResponse.json(prellenado)
}
