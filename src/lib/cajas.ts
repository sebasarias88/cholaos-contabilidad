/** Conteo en cajas + unidades (ej. barquillos: 24 unidades por caja). Todo se guarda en unidades. */

export function separarCajas(total: number, porCaja: number) {
  if (porCaja <= 0) return { cajas: 0, unidades: total }
  return { cajas: Math.floor(total / porCaja), unidades: total % porCaja }
}

export function juntarCajas(cajas: number, unidades: number, porCaja: number) {
  return Math.max(0, cajas) * porCaja + Math.max(0, unidades)
}

/** "2 cajas y 19 und" · "1 caja" · "7 und" */
export function formatCajas(total: number, porCaja: number | null | undefined): string {
  if (!porCaja || porCaja <= 0) return String(total)
  const { cajas, unidades } = separarCajas(total, porCaja)
  const c = cajas === 1 ? '1 caja' : `${cajas} cajas`
  if (cajas === 0) return `${unidades} und`
  if (unidades === 0) return c
  return `${c} y ${unidades} und`
}
