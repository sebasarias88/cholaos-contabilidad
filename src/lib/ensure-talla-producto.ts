import type { SupabaseClient } from '@supabase/supabase-js'
import type { TipoVaso } from '@/types'

type EnsureTallaInput = {
  productoId: string
  /** Onzas del vaso (se sincronizan en el producto) */
  onzas: number
  /** Si viene, solo vincula el producto a esa talla (no reescribe la talla) */
  tallaId?: string | null
  tipoVaso?: TipoVaso
  /** Etiqueta del vaso físico al crear uno nuevo (ej. "14 oz ancho") */
  descripcionTalla?: string | null
}

/**
 * Vincula un producto vaso a una talla física.
 * - Con tallaId: solo asigna (varios productos pueden compartir la misma talla).
 * - Sin tallaId: crea una talla nueva y la asigna.
 */
export async function ensureTallaProducto(
  supabase: SupabaseClient,
  input: EnsureTallaInput
): Promise<{ talla_id: string | null; error?: string }> {
  const onzas = Number(input.onzas)
  const tipo: TipoVaso = input.tipoVaso ?? 'normal'

  if (!Number.isFinite(onzas) || onzas <= 0) {
    return { talla_id: null, error: 'Onzas inválidas' }
  }

  if (input.tallaId) {
    const { data: talla, error: fetchError } = await supabase
      .from('tallas_vasos')
      .select('id, onzas, tipo, activo')
      .eq('id', input.tallaId)
      .single()

    if (fetchError || !talla) {
      return { talla_id: null, error: 'Vaso físico no encontrado' }
    }

    if (!talla.activo) {
      const { error: activarError } = await supabase
        .from('tallas_vasos')
        .update({ activo: true })
        .eq('id', talla.id)
      if (activarError) {
        return { talla_id: null, error: activarError.message }
      }
    }

    const { error: linkError } = await supabase
      .from('productos')
      .update({
        talla_id: talla.id,
        onzas: Number(talla.onzas),
      })
      .eq('id', input.productoId)

    if (linkError) {
      return { talla_id: null, error: linkError.message }
    }

    return { talla_id: talla.id }
  }

  const descripcion =
    input.descripcionTalla?.trim() ||
    (tipo === 'normal' ? `${onzas} oz` : `${onzas} oz ${tipo}`)

  const { data: talla, error: insertError } = await supabase
    .from('tallas_vasos')
    .insert({
      onzas,
      tipo,
      descripcion,
      activo: true,
    })
    .select('id')
    .single()

  if (insertError || !talla) {
    return {
      talla_id: null,
      error: insertError?.message ?? 'No se pudo crear el vaso físico',
    }
  }

  const { error: linkError } = await supabase
    .from('productos')
    .update({
      talla_id: talla.id,
      onzas,
    })
    .eq('id', input.productoId)

  if (linkError) {
    return { talla_id: null, error: linkError.message }
  }

  return { talla_id: talla.id }
}
