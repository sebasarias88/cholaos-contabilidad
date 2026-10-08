import { exportarReporte, type FormatoExport } from '@/lib/export-reportes'
import { agruparProductos, fillRango } from '@/lib/reportes'
import type { CierreDia, ResumenDia, Venta } from '@/types'

async function obtener<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error ?? 'Error obteniendo datos')
  return body as T
}

/** Descarga Excel o PDF de un período (consulta los datos y arma el archivo) */
export async function exportarPeriodo(
  formato: FormatoExport,
  { desde, hasta, nombreNegocio }: { desde: string; hasta: string; nombreNegocio: string }
) {
  const q = `desde=${desde}&hasta=${hasta}`
  const [resumen, ventas, cierres] = await Promise.all([
    obtener<ResumenDia[]>(`/api/reportes?${q}`),
    obtener<Venta[]>(`/api/ventas?${q}`),
    obtener<CierreDia[]>(`/api/cierres?${q}`),
  ])

  if (cierres.filter((c) => c.estado === 'cerrado').length === 0) {
    throw new Error('No hay cierres en este período')
  }

  return exportarReporte(formato, {
    nombreNegocio,
    desde,
    hasta,
    resumen: fillRango(resumen, desde, hasta),
    productos: agruparProductos(ventas),
    cierres,
  })
}
