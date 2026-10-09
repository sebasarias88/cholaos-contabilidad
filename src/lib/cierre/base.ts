/** Base de caja: la de anoche y, si el dueño sacó o metió plata, una base nueva */

/** Base que se usa en el cuadre: la nueva si se escribió, si no la de anoche */
export function baseEfectiva(estado: { dineroBase: number; baseNueva: number | null }) {
  return estado.baseNueva ?? estado.dineroBase
}

/**
 * Plata que salió de la base (positivo) o que se metió (negativo).
 * 0 si no hubo base nueva o si es un cierre antiguo sin ese dato.
 */
export function retiroBase(c: { base_anterior?: number | null; base_nueva?: number | null }) {
  if (c.base_anterior == null || c.base_nueva == null) return 0
  return c.base_anterior - c.base_nueva
}
