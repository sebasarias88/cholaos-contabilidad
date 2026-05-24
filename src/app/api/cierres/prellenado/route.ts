// GET /api/cierres/prellenado — sin params; pre-llena el formulario de hoy
import { CIERRE_SELECT, sanitizarCierreParaEmpleado } from '@/lib/cierres-api'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'
import type { CierreDia, ConteoVasoPrellenado, PrellenadoNuevo } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  // Obtener cierre de ayer para pre-llenar
  const { data: cierreAyer } = await supabase
    .from('cierres_dia')
    .select('dinero_final, conteo_vasos:conteo_vasos(talla_id, cantidad_final, talla:tallas_vasos(*))')
    .eq('fecha', ayer)
    .single()

  // Tallas activas: orden natural de la BD (sin sort por onzas)
  const { data: tallas } = await supabase
    .from('tallas_vasos')
    .select('*')
    .eq('activo', true)

  // Prellenado: solo cantidad_final de ayer → cantidad_inicio hoy.
  // Sin novedades del día anterior; cada día empieza con novedades: [].
  const conteo_vasos: ConteoVasoPrellenado[] =
    tallas?.map((talla) => {
      const conteoAyer = cierreAyer?.conteo_vasos?.find(
        (c: { talla_id: string; cantidad_final: number }) =>
          c.talla_id === talla.id
      )
      return {
        talla_id: talla.id,
        talla,
        cantidad_inicio: conteoAyer?.cantidad_final ?? 0,
        cantidad_nuevos: null,
        cantidad_final: null,
        novedades: [],
      }
    }) ?? []

  const prellenado: PrellenadoNuevo = {
    tipo: 'nuevo',
    dinero_base_inicio: cierreAyer?.dinero_final ?? 0,
    conteo_vasos,
  }

  return NextResponse.json(prellenado)
}
