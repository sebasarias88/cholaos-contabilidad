import type { SupabaseClient } from '@supabase/supabase-js'
import type { TipoVaso } from '@/types'

type EnsureTallaInput = {
  productoId: string
  nombre: string
  onzas: number
  tallaId?: string | null
  tipoVaso?: TipoVaso
}

/** Crea o actualiza la talla de vaso ligada al producto (requerida para el cierre). */
export async function ensureTallaProducto(
  supabase: SupabaseClient,
  input: EnsureTallaInput
): Promise<{ talla_id: string | null; error?: string }> {
  const nombre = input.nombre.trim()
  const onzas = Number(input.onzas)
  const tipo: TipoVaso = input.tipoVaso ?? 'normal'

  if (!nombre) {
    return { talla_id: null, error: 'Nombre de producto requerido' }
  }
  if (!Number.isFinite(onzas) || onzas <= 0) {
    return { talla_id: null, error: 'Onzas inválidas' }
  }

  if (input.tallaId) {
    const { error } = await supabase
      .from('tallas_vasos')
      .update({
        onzas,
        tipo,
        descripcion: nombre,
        activo: true,
      })
      .eq('id', input.tallaId)

    if (error) return { talla_id: null, error: error.message }
    return { talla_id: input.tallaId }
  }

  const { data: talla, error: insertError } = await supabase
    .from('tallas_vasos')
    .insert({
      onzas,
      tipo,
      descripcion: nombre,
      activo: true,
    })
    .select('id')
    .single()

  if (insertError || !talla) {
    return {
      talla_id: null,
      error: insertError?.message ?? 'No se pudo crear la talla',
    }
  }

  const { error: linkError } = await supabase
    .from('productos')
    .update({ talla_id: talla.id })
    .eq('id', input.productoId)

  if (linkError) {
    return { talla_id: null, error: linkError.message }
  }

  return { talla_id: talla.id }
}
