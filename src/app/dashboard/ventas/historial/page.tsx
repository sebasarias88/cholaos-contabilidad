import { Header } from '@/components/layout/Header'
import { TablaVentas } from '@/components/ventas/TablaVentas'
import { createClient } from '@/lib/supabase/server'
import { VENTA_SELECT } from '@/lib/supabase/queries'

export default async function HistorialVentasPage() {
  const supabase = await createClient()
  const { data: ventas } = await supabase
    .from('ventas')
    .select(VENTA_SELECT)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <>
      <Header title="Historial de ventas" />
      <div className="p-6">
        <TablaVentas ventas={ventas ?? []} />
      </div>
    </>
  )
}
