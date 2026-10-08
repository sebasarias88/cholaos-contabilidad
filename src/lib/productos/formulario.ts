import { tipoProducto } from '@/lib/productos-ui'
import type { Producto, TipoVaso } from '@/types'
import type { TipoProducto } from '@/types'

export type VarianteFormDraft = {
  id?: string
  nombre: string
  precio: string
}

export type ProductoFormState = {
  nombre: string
  tipo: TipoProducto
  onzas: string
  unidad: string
  precio: string
  descripcion: string
  tiene_variantes: boolean
  variantes: VarianteFormDraft[]
  /** '' = crear vaso nuevo; uuid = reutilizar talla existente */
  talla_id: string
  tipo_vaso: TipoVaso
  talla_descripcion: string
}

/** Estado del formulario de producto ↔ producto ↔ payload de la API (sin React) */
export const formVacio = (): ProductoFormState => ({
  nombre: '',
  tipo: 'vaso',
  onzas: '',
  unidad: '',
  precio: '',
  descripcion: '',
  tiene_variantes: false,
  variantes: [],
  talla_id: '',
  tipo_vaso: 'normal',
  talla_descripcion: '',
})

export function formDesdeProducto(p: Producto): ProductoFormState {
  const tipo = tipoProducto(p)
  const variantesActivas = (p.variantes ?? []).filter((v) => v.activo)
  return {
    nombre: p.nombre,
    tipo,
    onzas: p.onzas != null ? String(p.onzas) : '',
    unidad: p.unidad ?? '',
    precio: p.precio != null ? String(p.precio) : '',
    descripcion: p.descripcion ?? '',
    tiene_variantes: Boolean(p.tiene_variantes),
    variantes: variantesActivas.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      precio: String(v.precio),
    })),
    talla_id: p.talla_id ?? '',
    tipo_vaso: p.talla?.tipo ?? 'normal',
    talla_descripcion: p.talla?.descripcion ?? '',
  }
}

export function construirPayloadProducto(form: ProductoFormState) {
  const nombre = form.nombre.trim()
  const descripcion = form.descripcion.trim() || undefined
  const base = { nombre, tipo: form.tipo, descripcion }

  if (form.tipo === 'vaso') {
    const creandoNueva = !form.talla_id
    return {
      ...base,
      onzas: Number(form.onzas),
      precio: Number(form.precio),
      unidad: null,
      tiene_variantes: false,
      talla_id: creandoNueva ? null : form.talla_id,
      crear_talla: creandoNueva,
      tipo_vaso: form.tipo_vaso,
      talla_descripcion: form.talla_descripcion.trim() || null,
    }
  }

  if (form.tipo === 'comida') {
    const tiene = form.tiene_variantes
    return {
      ...base,
      unidad: form.unidad.trim(),
      precio: tiene ? null : Number(form.precio),
      onzas: null,
      tiene_variantes: tiene,
      talla_id: null,
    }
  }

  return {
    ...base,
    unidad: form.unidad.trim(),
    precio: null,
    onzas: null,
    tiene_variantes: false,
    talla_id: null,
  }
}

export function validarFormProducto(form: ProductoFormState): string | null {
  if (!form.nombre.trim()) return 'El nombre es requerido'
  if (form.tipo === 'vaso') {
    if (!form.talla_id) {
      if (!form.onzas || Number(form.onzas) <= 0) return 'Indica las onzas del vaso'
    } else if (!form.onzas || Number(form.onzas) <= 0) {
      return 'El vaso seleccionado no tiene onzas válidas'
    }
    if (!form.precio || Number(form.precio) < 0 || Number.isNaN(Number(form.precio))) {
      return 'Indica un precio válido'
    }
  }
  if (form.tipo === 'comida') {
    if (!form.unidad.trim()) return 'Indica la unidad'
    if (form.tiene_variantes) {
      if (form.variantes.length === 0) return 'Agrega al menos una variante'
      for (const v of form.variantes) {
        if (!v.nombre.trim()) return 'Cada variante necesita un nombre'
        if (!v.precio || Number(v.precio) < 0 || Number.isNaN(Number(v.precio))) {
          return 'Cada variante necesita un precio válido'
        }
      }
    } else if (!form.precio || Number(form.precio) < 0 || Number.isNaN(Number(form.precio))) {
      return 'Indica un precio válido'
    }
  }
  if (form.tipo === 'insumo' && !form.unidad.trim()) {
    return 'Indica la unidad'
  }
  return null
}
