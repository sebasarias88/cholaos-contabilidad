import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { formatPesos, getRangoFecha } from '@/lib/utils'

export default async function DashboardPage() {
  const { desde, hasta } = getRangoFecha('hoy')
  const supabase = await createClient()

  const { data: ventas } = await supabase
    .from('ventas')
    .select('total, detalle:detalle_ventas(cantidad)')
    .gte('fecha', desde)
    .lte('fecha', hasta)

  const totalHoy = ventas?.reduce((sum, v) => sum + Number(v.total), 0) ?? 0
  const cantidad = ventas?.length ?? 0
  const vasos =
    ventas?.reduce(
      (sum, v) =>
        sum + (v.detalle?.reduce((acc, d) => acc + Number(d.cantidad), 0) ?? 0),
      0
    ) ?? 0

  return (
    <>
      <Header title="Resumen del día" subtitle="Ventas registradas hoy" />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Total vendido hoy">
          <p className="text-3xl font-bold">{formatPesos(totalHoy)}</p>
        </Card>
        <Card title="Transacciones">
          <p className="text-3xl font-bold">{cantidad}</p>
        </Card>
        <Card title="Vasos vendidos">
          <p className="text-3xl font-bold">{vasos}</p>
        </Card>
      </div>
    </>
  )
}
