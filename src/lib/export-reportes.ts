import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ResumenDia } from '@/types'

export type ProductoVendidoExport = {
  nombre: string
  tipo: string
  medida: string
  cantidad: number
  ingresos: number
}

export type ExportReportesInput = {
  nombreNegocio: string
  desde: string
  hasta: string
  totalIngresos: number
  totalVasos: number
  promedioDiario: number
  diasPeriodo: number
  resumen: ResumenDia[]
  productos: ProductoVendidoExport[]
}

/** Escapa celda CSV (Excel ES usa `;`) */
function celda(valor: string | number): string {
  const s = String(valor)
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function fila(...cols: (string | number)[]) {
  return cols.map(celda).join(';')
}

function formatFechaLarga(iso: string) {
  try {
    return format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es })
  } catch {
    return iso
  }
}

/**
 * Genera CSV UTF-8 (BOM) con resumen, ingresos por día y productos.
 * Compatible con Excel en español (separador `;`).
 */
export function buildReportesCsv(data: ExportReportesInput): string {
  const lines: string[] = [
    fila(data.nombreNegocio),
    fila('Reporte de ventas'),
    fila(
      'Período',
      `${formatFechaLarga(data.desde)} — ${formatFechaLarga(data.hasta)}`
    ),
    fila('Generado', format(new Date(), "d/MM/yyyy HH:mm", { locale: es })),
    '',
    fila('RESUMEN'),
    fila('Ingresos totales', data.totalIngresos),
    fila('Vasos vendidos', data.totalVasos),
    fila('Promedio diario', Math.round(data.promedioDiario)),
    fila('Días en el período', data.diasPeriodo),
    '',
    fila('INGRESOS POR DÍA'),
    fila('Fecha', 'Ingresos', 'Vasos', 'Cierres'),
  ]

  for (const d of data.resumen) {
    lines.push(
      fila(d.fecha, d.ingresos, d.total_vasos, d.total_ventas)
    )
  }

  lines.push('')
  lines.push(fila('PRODUCTOS VENDIDOS'))
  lines.push(fila('Producto', 'Tipo', 'Medida', 'Cantidad', 'Ingresos'))

  for (const p of data.productos) {
    lines.push(
      fila(p.nombre, p.tipo, p.medida, p.cantidad, p.ingresos)
    )
  }

  return lines.join('\r\n')
}

export function downloadReportesCsv(data: ExportReportesInput) {
  const csv = buildReportesCsv(data)
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const nombre = `reporte-${data.desde}_${data.hasta}.csv`
  a.href = url
  a.download = nombre
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return nombre
}
