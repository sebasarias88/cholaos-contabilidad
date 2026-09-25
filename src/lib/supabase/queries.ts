export const VENTA_SELECT = `
  *,
  usuario:usuarios(nombre, rol),
  detalle:detalle_ventas(
    *,
    producto:productos(nombre, tipo, onzas, unidad)
  )
`
