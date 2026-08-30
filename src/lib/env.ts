function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`)
  }
  return value
}

/** URL del proyecto Supabase — solo servidor */
export function getSupabaseUrl(): string {
  return required('SUPABASE_URL')
}

/** Anon key — solo servidor (middleware, SSR, API routes) */
export function getSupabaseAnonKey(): string {
  return required('SUPABASE_ANON_KEY')
}

/** Service role — solo rutas API admin en servidor */
export function getSupabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY')
}
