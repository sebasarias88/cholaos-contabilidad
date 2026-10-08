import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CierreDia, ResumenDia } from '@/types'
import { fechaComoDate } from '@/lib/fechas'

export type FormatoExport = 'excel' | 'pdf'

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
  resumen: ResumenDia[]
  productos: ProductoVendidoExport[]
  cierres: CierreDia[]
}

type FilaDia = {
  fecha: string
  ventas: number
  vasos: number
  gastos: number
  transferencias: number
  domicilios: number
  base: number
  esperado: number
  contado: number
  diferencia: number
  responsable: string
}

type Totales = {
  ingresos: number
  vasos: number
  gastos: number
  transferencias: number
  domicilios: number
  diferencia: number
  diasConCierre: number
  diasPeriodo: number
  promedioDiario: number
}

function fechaLarga(iso: string) {
  return format(fechaComoDate(iso), "d 'de' MMMM yyyy", { locale: es })
}

function fechaCorta(iso: string) {
  return format(fechaComoDate(iso), 'dd/MM/yyyy')
}

function pesos(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function construirFilas(data: ExportReportesInput): { dias: FilaDia[]; totales: Totales } {
  const vasosPorFecha = new Map(data.resumen.map((r) => [r.fecha, r.total_vasos]))
  const dias: FilaDia[] = data.cierres
    .filter((c) => c.estado === 'cerrado')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => {
      const domicilios = Number(c.total_domicilios ?? 0)
      const esperado =
        c.dinero_base_inicio + c.total_ventas - c.total_transferencias - c.total_gastos - domicilios
      return {
        fecha: c.fecha,
        ventas: c.total_ventas,
        vasos: vasosPorFecha.get(c.fecha) ?? 0,
        gastos: c.total_gastos,
        transferencias: c.total_transferencias,
        domicilios,
        base: c.dinero_base_inicio,
        esperado,
        contado: c.dinero_final,
        diferencia: c.dinero_final - esperado,
        responsable: c.usuario?.nombre ?? '',
      }
    })

  const suma = (k: keyof FilaDia) => dias.reduce((s, d) => s + Number(d[k]), 0)
  const diasPeriodo =
    Math.round(
      (fechaComoDate(data.hasta).getTime() - fechaComoDate(data.desde).getTime()) / 86_400_000
    ) + 1
  const ingresos = suma('ventas')

  return {
    dias,
    totales: {
      ingresos,
      vasos: suma('vasos'),
      gastos: suma('gastos'),
      transferencias: suma('transferencias'),
      domicilios: suma('domicilios'),
      diferencia: suma('diferencia'),
      diasConCierre: dias.length,
      diasPeriodo,
      promedioDiario: dias.length > 0 ? Math.round(ingresos / dias.length) : 0,
    },
  }
}

function gastosDetalle(cierres: CierreDia[]) {
  return cierres
    .filter((c) => c.estado === 'cerrado')
    .flatMap((c) =>
      (c.gastos ?? []).map((g) => ({ fecha: c.fecha, descripcion: g.descripcion, monto: g.monto }))
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function nombreArchivo(data: ExportReportesInput, ext: string) {
  return `reporte-ventas_${data.desde}_${data.hasta}.${ext}`
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ------------------------------------------------------------------
// EXCEL
// ------------------------------------------------------------------
async function exportarExcel(data: ExportReportesInput) {
  const ExcelJS = (await import('exceljs')).default
  const { dias, totales } = construirFilas(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = data.nombreNegocio
  wb.created = new Date()

  const FMT_PESOS = '"$"#,##0;[Red]-"$"#,##0'
  const COLOR_HEADER = 'FF0E7490'

  function estilizarEncabezado(row: import('exceljs').Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER } }
    row.alignment = { vertical: 'middle' }
    row.height = 20
  }

  // Resumen
  const res = wb.addWorksheet('Resumen')
  res.columns = [{ width: 30 }, { width: 22 }]
  res.addRow([data.nombreNegocio]).font = { bold: true, size: 14 }
  res.addRow(['Reporte de ventas'])
  res.addRow(['Período', `${fechaLarga(data.desde)} — ${fechaLarga(data.hasta)}`])
  res.addRow(['Generado', format(new Date(), 'dd/MM/yyyy HH:mm')])
  res.addRow([])
  const filasResumen: [string, number, boolean][] = [
    ['Ventas totales', totales.ingresos, true],
    ['Vasos vendidos', totales.vasos, false],
    ['Días con cierre', totales.diasConCierre, false],
    ['Días del período', totales.diasPeriodo, false],
    ['Promedio por día con cierre', totales.promedioDiario, true],
    ['Gastos', totales.gastos, true],
    ['Transferencias', totales.transferencias, true],
    ['Domicilios', totales.domicilios, true],
    ['Diferencia de caja acumulada', totales.diferencia, true],
  ]
  for (const [label, valor, esPesos] of filasResumen) {
    const row = res.addRow([label, valor])
    row.getCell(1).font = { bold: true }
    if (esPesos) row.getCell(2).numFmt = FMT_PESOS
  }

  // Por día
  const hd = wb.addWorksheet('Por día')
  hd.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Ventas', key: 'ventas', width: 14 },
    { header: 'Vasos', key: 'vasos', width: 8 },
    { header: 'Gastos', key: 'gastos', width: 13 },
    { header: 'Transferencias', key: 'transferencias', width: 15 },
    { header: 'Domicilios', key: 'domicilios', width: 13 },
    { header: 'Base inicio', key: 'base', width: 13 },
    { header: 'Esperado', key: 'esperado', width: 13 },
    { header: 'Contado', key: 'contado', width: 13 },
    { header: 'Diferencia', key: 'diferencia', width: 13 },
    { header: 'Responsable', key: 'responsable', width: 18 },
  ]
  estilizarEncabezado(hd.getRow(1))
  for (const d of dias) hd.addRow({ ...d, fecha: fechaCorta(d.fecha) })
  const total = hd.addRow({
    fecha: 'TOTAL',
    ventas: totales.ingresos,
    vasos: totales.vasos,
    gastos: totales.gastos,
    transferencias: totales.transferencias,
    domicilios: totales.domicilios,
    diferencia: totales.diferencia,
  })
  total.font = { bold: true }
  for (const key of [
    'ventas',
    'gastos',
    'transferencias',
    'domicilios',
    'base',
    'esperado',
    'contado',
    'diferencia',
  ]) {
    hd.getColumn(key).numFmt = FMT_PESOS
  }
  hd.views = [{ state: 'frozen', ySplit: 1 }]

  // Productos
  const pr = wb.addWorksheet('Productos')
  pr.columns = [
    { header: 'Producto', key: 'nombre', width: 32 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Medida', key: 'medida', width: 12 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Ingresos', key: 'ingresos', width: 15 },
  ]
  estilizarEncabezado(pr.getRow(1))
  for (const p of data.productos) pr.addRow(p)
  pr.getColumn('ingresos').numFmt = FMT_PESOS
  pr.views = [{ state: 'frozen', ySplit: 1 }]

  // Gastos
  const gs = wb.addWorksheet('Gastos')
  gs.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Descripción', key: 'descripcion', width: 40 },
    { header: 'Monto', key: 'monto', width: 14 },
  ]
  estilizarEncabezado(gs.getRow(1))
  for (const g of gastosDetalle(data.cierres)) gs.addRow({ ...g, fecha: fechaCorta(g.fecha) })
  gs.getColumn('monto').numFmt = FMT_PESOS

  const buffer = await wb.xlsx.writeBuffer()
  const nombre = nombreArchivo(data, 'xlsx')
  descargar(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    nombre
  )
  return nombre
}

// ------------------------------------------------------------------
// PDF
// ------------------------------------------------------------------
async function exportarPdf(data: ExportReportesInput) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const { dias, totales } = construirFilas(data)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
  const margen = 36
  const azul: [number, number, number] = [14, 116, 144]

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.nombreNegocio, margen, 44)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Reporte de ventas · ${fechaLarga(data.desde)} — ${fechaLarga(data.hasta)}`, margen, 62)
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margen, 76)

  autoTable(doc, {
    startY: 92,
    margin: { left: margen, right: margen },
    theme: 'grid',
    headStyles: { fillColor: azul },
    styles: { fontSize: 9 },
    head: [
      [
        'Ventas totales',
        'Vasos',
        'Días con cierre',
        'Promedio/día',
        'Gastos',
        'Transferencias',
        'Domicilios',
        'Diferencia caja',
      ],
    ],
    body: [
      [
        pesos(totales.ingresos),
        String(totales.vasos),
        `${totales.diasConCierre} de ${totales.diasPeriodo}`,
        pesos(totales.promedioDiario),
        pesos(totales.gastos),
        pesos(totales.transferencias),
        pesos(totales.domicilios),
        pesos(totales.diferencia),
      ],
    ],
  })

  type DocConTabla = typeof doc & { lastAutoTable?: { finalY: number } }
  const siguienteY = () => ((doc as DocConTabla).lastAutoTable?.finalY ?? 100) + 24

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  let y = siguienteY()
  doc.text('Detalle por día', margen, y)
  autoTable(doc, {
    startY: y + 8,
    margin: { left: margen, right: margen },
    theme: 'striped',
    headStyles: { fillColor: azul },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
    head: [
      [
        'Fecha',
        'Ventas',
        'Vasos',
        'Gastos',
        'Transf.',
        'Domicilios',
        'Esperado',
        'Contado',
        'Diferencia',
        'Responsable',
      ],
    ],
    body: dias.map((d) => [
      fechaCorta(d.fecha),
      pesos(d.ventas),
      String(d.vasos),
      pesos(d.gastos),
      pesos(d.transferencias),
      pesos(d.domicilios),
      pesos(d.esperado),
      pesos(d.contado),
      pesos(d.diferencia),
      d.responsable,
    ]),
    foot: [
      [
        'TOTAL',
        pesos(totales.ingresos),
        String(totales.vasos),
        pesos(totales.gastos),
        pesos(totales.transferencias),
        pesos(totales.domicilios),
        '',
        '',
        pesos(totales.diferencia),
        '',
      ],
    ],
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
  })

  if (data.productos.length > 0) {
    y = siguienteY()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Productos vendidos', margen, y)
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margen, right: margen },
      theme: 'striped',
      headStyles: { fillColor: azul },
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
      head: [['Producto', 'Tipo', 'Medida', 'Cantidad', 'Ingresos']],
      body: data.productos.map((p) => [
        p.nombre,
        p.tipo,
        p.medida,
        String(p.cantidad),
        pesos(p.ingresos),
      ]),
    })
  }

  const gastos = gastosDetalle(data.cierres)
  if (gastos.length > 0) {
    y = siguienteY()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Gastos', margen, y)
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margen, right: margen },
      theme: 'striped',
      headStyles: { fillColor: azul },
      styles: { fontSize: 8 },
      columnStyles: { 2: { halign: 'right' } },
      head: [['Fecha', 'Descripción', 'Monto']],
      body: gastos.map((g) => [fechaCorta(g.fecha), g.descripcion, pesos(g.monto)]),
    })
  }

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Página ${i} de ${paginas}`,
      doc.internal.pageSize.getWidth() - margen,
      doc.internal.pageSize.getHeight() - 16,
      { align: 'right' }
    )
  }

  const nombre = nombreArchivo(data, 'pdf')
  doc.save(nombre)
  return nombre
}

export async function exportarReporte(formato: FormatoExport, data: ExportReportesInput) {
  return formato === 'excel' ? exportarExcel(data) : exportarPdf(data)
}
