/** Valida y deja solo los campos permitidos de una variante */
export function normalizarVariante(
  body: Record<string, unknown>,
  parcial: boolean
): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {}

  if (body.nombre !== undefined || !parcial) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    if (!nombre) return { error: 'El nombre de la variante es requerido' }
    data.nombre = nombre.slice(0, 80)
  }
  if (body.precio !== undefined || !parcial) {
    const precio = Number(body.precio)
    if (!Number.isFinite(precio) || precio < 0) return { error: 'Precio de variante inválido' }
    data.precio = Math.round(precio)
  }
  if (body.orden !== undefined) {
    const orden = Number(body.orden)
    if (Number.isFinite(orden)) data.orden = Math.trunc(orden)
  }
  if (body.activo !== undefined) data.activo = Boolean(body.activo)

  return { data }
}
