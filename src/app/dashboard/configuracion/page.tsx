import type { Metadata } from 'next'
import { ConfiguracionPanel } from '@/components/configuracion/ConfiguracionPanel'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  const usuario = await requireAdmin()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <ConfiguracionPanel
        usuario={usuario}
        email={user?.email ?? ''}
      />
    </div>
  )
}
