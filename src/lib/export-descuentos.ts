import { format } from 'date-fns'
import {
  etiquetaTipoPersona,
  textosCuenta,
  totalesResumen,
  type ResumenPersona,
} from '@/lib/descuentos'
import { descargar, fechaCorta, fechaLarga, pesos } from '@/lib/export-reportes'
import type { FormatoExport } from '@/lib/export-reportes'
import { fechaColombia } from '@/lib/fechas'

export type ExportDescuentosInput = {
  nombreNegocio: string
  desde: string
  hasta: string
  resumen: ResumenPersona[]
}

function estadoFila(r: ResumenPersona, d: ResumenPersona['descuentos'][number]) {
  const textos = textosCuenta(r.persona.tipo)
  if (!textos) return 'No se cobra'
  return d.liquidacion
    ? `${textos.saldado} ${fechaCorta(fechaColombia(new Date(d.liquidacion.created_at)))}`
    : textos.pendiente
}

/** A la familia no se le cobra: en vez de $0 se muestra una raya */
function cifraCobro(r: ResumenPersona, valor: number) {
  return textosCuenta(r.persona.tipo) ? valor : '—'
}

function concepto(texto: string) {
  return texto.trim() || '—'
}

/** Encabezado y total alineados a la derecha en las columnas de plata */
function alinearDerecha(columnas: number[]) {
  return (data: {
    section: string
    column: { index: number }
    cell: { styles: { halign?: string } }
  }) => {
    if (data.section !== 'body' && columnas.includes(data.column.index)) {
      data.cell.styles.halign = 'right'
    }
  }
}

function nombreArchivo(data: ExportDescuentosInput, ext: string) {
  return `descuentos_${data.desde}_${data.hasta}.${ext}`
}

async function exportarExcel(data: ExportDescuentosInput) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = data.nombreNegocio
  wb.created = new Date()
  const FMT_PESOS = '"$"#,##0;[Red]-"$"#,##0'

  function encabezado(row: import('exceljs').Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD14A1F' } }
    row.alignment = { vertical: 'middle' }
    row.height = 20
  }

  const totales = totalesResumen(data.resumen)
  const rs = wb.addWorksheet('Por persona')
  rs.addRow([data.nombreNegocio]).font = { bold: true, size: 14 }
  rs.addRow([`Descuentos por persona · ${fechaLarga(data.desde)} — ${fechaLarga(data.hasta)}`])
  rs.addRow([`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`])
  rs.addRow([])
  const cab = rs.addRow([
    'Persona',
    'Tipo',
    'Total del periodo',
    'Pendiente (sueldo o cobro)',
    'Ya descontado o cobrado',
    'Pendiente de antes',
  ])
  encabezado(cab)
  for (const r of data.resumen) {
    rs.addRow([
      r.persona.nombre,
      etiquetaTipoPersona(r.persona.tipo),
      r.total,
      cifraCobro(r, r.pendiente),
      cifraCobro(r, r.descontado),
      cifraCobro(r, r.pendienteAnterior),
    ])
  }
  const tot = rs.addRow(['TOTAL', '', totales.total, totales.pendiente, totales.descontado, ''])
  tot.font = { bold: true }
  const anchos = [24, 12, 18, 24, 24, 18]
  for (let i = 0; i < anchos.length; i++) {
    const col = rs.getColumn(i + 1)
    col.width = anchos[i]
    if (i >= 2) col.numFmt = FMT_PESOS
  }

  const ds = wb.addWorksheet('Detalle')
  ds.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Persona', key: 'persona', width: 22 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Concepto', key: 'concepto', width: 30 },
    { header: 'Monto', key: 'monto', width: 14 },
    { header: 'Estado', key: 'estado', width: 22 },
  ]
  encabezado(ds.getRow(1))
  for (const r of data.resumen) {
    for (const d of r.descuentos) {
      ds.addRow({
        fecha: fechaCorta(d.fecha),
        persona: r.persona.nombre,
        tipo: etiquetaTipoPersona(r.persona.tipo),
        concepto: concepto(d.descripcion),
        monto: d.monto,
        estado: estadoFila(r, d),
      })
    }
  }
  ds.getColumn('monto').numFmt = FMT_PESOS
  ds.views = [{ state: 'frozen', ySplit: 1 }]

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

/** PDF: resumen + una hoja por persona (comprobante del empleado, cuenta de cobro del cliente) */
async function exportarPdf(data: ExportDescuentosInput) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margen = 40
  const marca: [number, number, number] = [209, 74, 31]
  const ancho = doc.internal.pageSize.getWidth()
  const periodo = `${fechaLarga(data.desde)} — ${fechaLarga(data.hasta)}`
  type DocConTabla = typeof doc & { lastAutoTable?: { finalY: number } }
  const finTabla = () => (doc as DocConTabla).lastAutoTable?.finalY ?? 100

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(data.nombreNegocio, margen, 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Descuentos por persona · ${periodo}`, margen, 66)
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margen, 80)

  const totales = totalesResumen(data.resumen)
  autoTable(doc, {
    startY: 96,
    margin: { left: margen, right: margen },
    theme: 'striped',
    headStyles: { fillColor: marca },
    styles: { fontSize: 9 },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    didParseCell: alinearDerecha([2, 3, 4]),
    head: [['Persona', 'Tipo', 'Total', 'Pendiente', 'Descontado o cobrado']],
    body: data.resumen.map((r) => {
      const cobra = textosCuenta(r.persona.tipo) !== null
      return [
        r.persona.nombre,
        etiquetaTipoPersona(r.persona.tipo),
        pesos(r.total),
        cobra ? pesos(r.pendiente) : 'No se cobra',
        cobra ? pesos(r.descontado) : '—',
      ]
    }),
    foot: [
      ['TOTAL', '', pesos(totales.total), pesos(totales.pendiente), pesos(totales.descontado)],
    ],
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
  })

  for (const r of data.resumen) {
    if (r.descuentos.length === 0) continue
    const textos = textosCuenta(r.persona.tipo)
    doc.addPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(textos?.comprobante ?? 'Registro de consumos', margen, 52)
    doc.setFontSize(12)
    doc.text(r.persona.nombre, margen, 74)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${etiquetaTipoPersona(r.persona.tipo)} · ${data.nombreNegocio}`, margen, 90)
    doc.text(`Periodo: ${periodo}`, margen, 104)

    autoTable(doc, {
      startY: 120,
      margin: { left: margen, right: margen },
      theme: 'grid',
      headStyles: { fillColor: marca },
      styles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' } },
      didParseCell: alinearDerecha([2]),
      head: [['Fecha', 'Concepto', 'Monto', 'Estado']],
      body: r.descuentos.map((d) => [
        fechaCorta(d.fecha),
        concepto(d.descripcion),
        pesos(d.monto),
        estadoFila(r, d),
      ]),
      foot: [['TOTAL', '', pesos(r.total), '']],
      footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
    })

    let y = finTabla() + 22
    doc.setFontSize(10)
    if (!textos) {
      // Familia: solo el registro de lo que se le dio, sin cobros ni firmas
      doc.text('Lo que se le dio a la familia no se cobra: es solo el registro.', margen, y)
      continue
    }
    doc.text(`${textos.saldadoLargo}: ${pesos(r.descontado)}`, margen, y)
    doc.setFont('helvetica', 'bold')
    doc.text(`${textos.pendiente}: ${pesos(r.pendiente)}`, margen, y + 16)
    doc.setFont('helvetica', 'normal')
    if (r.pendienteAnterior > 0) {
      doc.text(
        `Además tiene ${pesos(r.pendienteAnterior)} ${textos.pendiente.toLowerCase()} de antes de este periodo.`,
        margen,
        y + 32
      )
    }

    y = Math.max(y + 100, finTabla() + 120)
    doc.setDrawColor(150)
    doc.line(margen, y, margen + 200, y)
    doc.line(ancho - margen - 200, y, ancho - margen, y)
    doc.setFontSize(9)
    doc.text(`Firma ${r.persona.nombre}`, margen, y + 14)
    doc.text('Firma administrador', ancho - margen - 200, y + 14)
  }

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Página ${i} de ${paginas}`, ancho - margen, doc.internal.pageSize.getHeight() - 18, {
      align: 'right',
    })
  }

  const nombre = nombreArchivo(data, 'pdf')
  doc.save(nombre)
  return nombre
}

export async function exportarDescuentos(formato: FormatoExport, data: ExportDescuentosInput) {
  return formato === 'excel' ? exportarExcel(data) : exportarPdf(data)
}
