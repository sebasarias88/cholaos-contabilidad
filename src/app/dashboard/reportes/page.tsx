import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { GraficoVentas } from '@/components/reportes/GraficoVentas'
import { createClient } from '@/lib/supabase/server'
import { formatPesos, getRangoFecha } from '@/lib/utils'
import type { ResumenDia } from '@/types'

type PeriodoUI = 'diario' | 'semanal' | 'quincenal'

function periodoARango(periodo: PeriodoUI) {
  const map: Record<PeriodoUI, 'hoy' | 'semana' | 'quincena'> = {
    diario: 'hoy',
    semanal: 'semana',
    quincenal: 'quincena',
  }
  return getRangoFecha(map[periodo] ?? 'semana')
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const params = await searchParams
  const periodo = (params.periodo ?? 'semanal') as PeriodoUI
  const { desde, hasta } = periodoARango(periodo)

  const supabase = await createClient()
  const { data: ventas } = await supabase
    .from('ventas')
    .select('fecha, total, detalle:detalle_ventas(cantidad)')
    .gte('fecha', desde)
    .lte('fecha', hasta)

  const porDiaMap = new Map<string, ResumenDia>()

  for (const venta of ventas ?? []) {
    const vasos =
      venta.detalle?.reduce((acc, d) => acc + Number(d.cantidad), 0) ?? 0
    const prev = porDiaMap.get(venta.fecha) ?? {
      fecha: venta.fecha,
      total_ventas: 0,
      total_vasos: 0,
      ingresos: 0,
    }
    porDiaMap.set(venta.fecha, {
      fecha: venta.fecha,
      total_ventas: prev.total_ventas + 1,
      total_vasos: prev.total_vasos + vasos,
      ingresos: prev.ingresos + Number(venta.total),
    })
  }

  const resumen = Array.from(porDiaMap.values())
  const totalIngresos = resumen.reduce((acc, r) => acc + r.ingresos, 0)
  const totalVasos = resumen.reduce((acc, r) => acc + r.total_vasos, 0)
  const grafico = resumen.map((r) => ({ fecha: r.fecha, total: r.ingresos }))

  return (
    <>
      <Header title="Reportes" subtitle="Diario, semanal y quincenal" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex gap-2">
          {(['diario', 'semanal', 'quincenal'] as const).map((p) => (
            <a
              key={p}
              href={`/dashboard/reportes?periodo=${p}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                periodo === p
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Ingresos del período">
            <p className="text-2xl font-bold">{formatPesos(totalIngresos)}</p>
          </Card>
          <Card title="Transacciones">
            <p className="text-2xl font-bold">
              {resumen.reduce((acc, r) => acc + r.total_ventas, 0)}
            </p>
          </Card>
          <Card title="Vasos vendidos">
            <p className="text-2xl font-bold">{totalVasos}</p>
          </Card>
        </div>
        <Card title="Ingresos por día">
          <GraficoVentas data={grafico} />
        </Card>
      </div>
    </>
  )
}
