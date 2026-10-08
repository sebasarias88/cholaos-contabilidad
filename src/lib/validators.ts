export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Mínimo exigido por Supabase Auth (6) */
export const PASSWORD_MIN = 6

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN
}

export function isUuid(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)
  )
}
