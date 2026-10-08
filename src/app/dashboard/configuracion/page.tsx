import type { Metadata } from 'next'
import { ConfiguracionPanel } from '@/components/configuracion/ConfiguracionPanel'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { EncabezadoPagina } from '@/components/ui/EncabezadoPagina'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  const usuario = await requireAdmin()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Equipo, medios de pago, motivos de novedad y tu cuenta."
      />
      <ConfiguracionPanel usuario={usuario} email={user?.email ?? ''} />
    </div>
  )
}
