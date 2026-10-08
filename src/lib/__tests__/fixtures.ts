import type { DatosCierre, Producto, TallaVaso } from '@/types'

export const talla = (id: string, descripcion: string, onzas = 16): TallaVaso => ({
  id,
  onzas,
  descripcion,
  tipo: 'normal',
  activo: true,
  created_at: '2026-01-01',
})

export function producto(p: Partial<Producto> & { id: string; nombre: string }): Producto {
  return {
    tipo: 'vaso',
    activo: true,
    orden: 0,
    tiene_variantes: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...p,
  }
}

export const T16 = talla('t16', '16 oz')
export const T14 = talla('t14', '14 oz ancho', 14)

export const PRODUCTOS: Producto[] = [
  producto({ id: 'p-extra', nombre: 'Extra Grande', talla_id: 't16', talla: T16, precio: 15000 }),
  producto({ id: 'p-cholao', nombre: 'Cholao Grande', talla_id: 't14', talla: T14, precio: 13000 }),
  producto({ id: 'p-malteada', nombre: 'Malteada', talla_id: 't14', talla: T14, precio: 16000 }),
  producto({ id: 'p-gaseosa', nombre: 'Gaseosa', tipo: 'comida', precio: 4500, unidad: 'und' }),
  producto({
    id: 'p-pizza',
    nombre: 'Pizza',
    tipo: 'comida',
    tiene_variantes: true,
    unidad: 'porción',
    variantes: [
      {
        id: 'v-mesa',
        producto_id: 'p-pizza',
        nombre: 'Mesa',
        precio: 9000,
        activo: true,
        orden: 1,
      },
    ],
  }),
  producto({ id: 'p-barquillo', nombre: 'Barquillo', tipo: 'insumo', unidad: 'caja' }),
]

export function datosCierre(extra: Partial<DatosCierre> = {}): DatosCierre {
  return {
    fecha: '2026-10-07',
    hoy: '2026-10-07',
    ultimo_cierre: '2026-10-06',
    fecha_anterior: '2026-10-06',
    dinero_base_inicio: 50000,
    base_conteos: [
      { talla_id: 't16', producto_id: null, cantidad_final: 4 },
      { talla_id: 't14', producto_id: null, cantidad_final: 6 },
      { talla_id: null, producto_id: 'p-barquillo', cantidad_final: 10 },
    ],
    productos: PRODUCTOS,
    motivos: [],
    medios: [],
    cierre: null,
    ...extra,
  }
}
