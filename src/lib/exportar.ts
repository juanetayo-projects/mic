// Exportación a Excel (ExcelJS) y PDF (pdfmake) con logo y título institucional.
import ExcelJS from 'exceljs'

const AZUL = 'FF0D2D6B'

async function logoBase64(): Promise<string> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}images/logo_cacsb2.png`)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

function descargar(blob: Blob, archivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = archivo; a.click()
  URL.revokeObjectURL(url)
}

export type ColExport = { header: string; key: string; width?: number }

export async function exportarExcel(
  titulo: string, columnas: ColExport[], filas: Record<string, unknown>[], archivo: string,
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MIC · Clínica CAC Santa Bárbara'
  const ws = wb.addWorksheet('Datos', { views: [{ state: 'frozen', ySplit: 3 }] })

  // Logo
  const b64 = await logoBase64()
  if (b64) {
    const imgId = wb.addImage({ base64: b64, extension: 'png' })
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 110, height: 44 } })
  }
  // Título
  const lastCol = String.fromCharCode(64 + Math.min(columnas.length, 26))
  ws.mergeCells(`B1:${lastCol}1`)
  const tCell = ws.getCell('B1')
  tCell.value = titulo
  tCell.font = { bold: true, size: 14, color: { argb: AZUL } }
  tCell.alignment = { vertical: 'middle' }
  ws.getRow(1).height = 36
  ws.mergeCells(`B2:${lastCol}2`)
  ws.getCell('B2').value = `Clínica CAC Santa Bárbara · Generado ${new Date().toLocaleString('es-CO')}`
  ws.getCell('B2').font = { size: 9, color: { argb: 'FF64748B' } }

  // Encabezados (fila 3)
  ws.columns = columnas.map((c) => ({ key: c.key, width: c.width ?? 20 }))
  const head = ws.getRow(3)
  columnas.forEach((c, i) => {
    const cell = head.getCell(i + 1)
    cell.value = c.header
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })
  head.height = 22

  // Datos
  filas.forEach((f, idx) => {
    const r = ws.addRow(f)
    if (idx % 2) r.eachCell({ includeEmpty: true }, (c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    })
  })

  const buf = await wb.xlsx.writeBuffer()
  descargar(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${archivo}.xlsx`)
}

export async function exportarPDF(
  titulo: string, headers: string[], filas: (string | number)[][], archivo: string,
) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default as any
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')) as any
  pdfMake.vfs = pdfFonts.vfs ?? pdfFonts.pdfMake?.vfs ?? pdfFonts.default?.vfs ?? pdfFonts.default?.pdfMake?.vfs
  const b64 = await logoBase64()

  const widths = headers.map(() => '*')
  const doc = pdfMake.createPdf({
    pageOrientation: 'landscape',
    pageMargins: [24, 90, 24, 30],
    header: {
      margin: [24, 16, 24, 0],
      columns: [
        b64 ? { image: b64, width: 90 } : { text: '' },
        [
          { text: titulo, style: 'h' },
          { text: 'Clínica CAC Santa Bárbara · Movilidad Interna (MIC)', style: 'sub' },
          { text: `Generado ${new Date().toLocaleString('es-CO')}`, style: 'sub' },
        ],
      ],
    },
    content: [
      {
        table: { headerRows: 1, widths, body: [headers.map((h) => ({ text: h, color: 'white', bold: true })), ...filas] },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0D2D6B' : rowIndex % 2 ? '#F1F5F9' : null),
          hLineColor: () => '#CBD5E1', vLineColor: () => '#CBD5E1',
        },
      },
    ],
    styles: {
      h: { fontSize: 14, bold: true, color: '#0D2D6B', margin: [10, 4, 0, 0] },
      sub: { fontSize: 8, color: '#64748B', margin: [10, 1, 0, 0] },
    },
    defaultStyle: { fontSize: 7 },
  })
  // getBlob + descarga propia: más fiable que doc.download() entre navegadores
  doc.getBlob((blob: Blob) => descargar(blob, `${archivo}.pdf`))
}
