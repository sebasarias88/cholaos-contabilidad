import { describe, expect, it } from 'vitest'
import { generarPasswordSimple } from '@/lib/utils'
import { isValidEmail, isValidPassword, isUuid } from '@/lib/validators'
import {
  construirPayloadProducto,
  formVacio,
  validarFormProducto,
} from '@/lib/productos/formulario'

describe('generarPasswordSimple', () => {
  it('usa el inicio del correo + 4 números', () => {
    expect(generarPasswordSimple('Carlos.Pérez@gmail.com')).toMatch(/^carlosperez\d{4}$/)
  })

  it('siempre cumple el mínimo de Supabase', () => {
    expect(isValidPassword(generarPasswordSimple('a@b.co'))).toBe(true)
  })
})

describe('validadores', () => {
  it('correo y uuid', () => {
    expect(isValidEmail('cajera@gmail.com')).toBe(true)
    expect(isValidEmail('cajera@')).toBe(false)
    expect(isUuid('97aef708-f3b1-4baa-a7d2-b07b793e1da7')).toBe(true)
    expect(isUuid('1; drop table')).toBe(false)
  })
})

describe('formulario de producto', () => {
  it('pide onzas y precio para vasos', () => {
    expect(validarFormProducto({ ...formVacio(), nombre: 'Cholao' })).toBe(
      'Indica las onzas del vaso'
    )
  })

  it('un vaso sin talla elegida crea vaso físico nuevo', () => {
    const p = construirPayloadProducto({
      ...formVacio(),
      nombre: 'Cholao',
      onzas: '16',
      precio: '13000',
    })
    expect(p).toMatchObject({ crear_talla: true, talla_id: null, onzas: 16, precio: 13000 })
  })
})
