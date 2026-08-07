import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  SalesReportPdfRenderer,
  SalesReportView,
} from '../../domain/sales-report-view';

/** Misma paleta y medidas que el comprobante, para que ambos PDF combinen. */
const COLOR = {
  ink: '#1f2733',
  soft: '#6b7280',
  accent: '#2f3a4a',
  line: '#d7dbe0',
  headFill: '#2f3a4a',
  headText: '#ffffff',
  zebra: '#f5f6f8',
};

const MARGIN = 50;
const RIGHT = 545; // A4 (595) menos el margen derecho.

/**
 * Columnas de la tabla. Las tres de importe se alinean a la derecha; el resto a
 * la izquierda. `client` se recorta con puntos suspensivos si no entra.
 */
const COLS = {
  item: MARGIN, // #
  number: 72, // N. comprobante
  date: 165, // Fecha
  client: 226, // Cliente
  subtotal: 352, // Subtotal (derecha)
  igv: 412, // IGV (derecha)
  total: 464, // Total (derecha)
} as const;

/**
 * Dibuja un reporte de ventas por rango de fechas en un PDF y lo devuelve como
 * Buffer.
 *
 * Igual que el generador del comprobante: pdfkit escribe en un stream cuyos
 * chunks se juntan en memoria, sin tocar el disco, que es lo que necesita la
 * respuesta en base64. Cada llamada crea su propio documento; el generador no
 * guarda estado y es seguro de reutilizar.
 */
@Injectable()
export class SalesReportPdfGenerator implements SalesReportPdfRenderer {
  render(view: SalesReportView): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.encabezado(doc, view);
        const tablaBottom = this.tabla(doc, view);
        this.totales(doc, view, tablaBottom);
        this.pie(doc);
        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private encabezado(doc: PDFKit.PDFDocument, v: SalesReportView): void {
    // Emisor a la izquierda: la empresa que emite el reporte.
    doc
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('Michael Dev S.A.C.', MARGIN, MARGIN);
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(9)
      .text('Tienda de tecnologia', MARGIN, MARGIN + 24)
      .text('RUC 20601054702', MARGIN, MARGIN + 36);

    // Recuadro del reporte a la derecha. El titulo cambia segun sea un solo dia
    // o un rango, que es justo lo que pidio el reporte.
    const bx = 340;
    const bw = RIGHT - bx;
    doc.roundedRect(bx, MARGIN, bw, 66, 6).lineWidth(1).stroke(COLOR.accent);

    const titulo = v.singleDay ? 'VENTAS DEL DIA' : 'REPORTE DE VENTAS';
    const periodo = v.singleDay ? v.dateFrom : `${v.dateFrom}  a  ${v.dateTo}`;

    doc
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(titulo, bx, MARGIN + 8, { width: bw, align: 'center' });
    doc
      .fillColor(COLOR.ink)
      .fontSize(12)
      .text(periodo, bx, MARGIN + 26, { width: bw, align: 'center' });
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(9)
      .text(
        `${v.totals.count} comprobante${v.totals.count === 1 ? '' : 's'}`,
        bx,
        MARGIN + 48,
        { width: bw, align: 'center' },
      );

    doc.moveTo(MARGIN, 132).lineTo(RIGHT, 132).lineWidth(1).stroke(COLOR.line);
  }

  private cabeceraTabla(doc: PDFKit.PDFDocument, y: number): number {
    const h = 20;
    doc.rect(MARGIN, y, RIGHT - MARGIN, h).fill(COLOR.headFill);
    doc.fillColor(COLOR.headText).font('Helvetica-Bold').fontSize(8);
    const ty = y + 7;
    doc.text('#', COLS.item + 2, ty);
    doc.text('Comprobante', COLS.number, ty);
    doc.text('Fecha', COLS.date, ty);
    doc.text('Cliente', COLS.client, ty);
    doc.text('Subtotal', COLS.subtotal, ty, {
      width: COLS.igv - COLS.subtotal - 4,
      align: 'right',
    });
    doc.text('IGV', COLS.igv, ty, {
      width: COLS.total - COLS.igv - 4,
      align: 'right',
    });
    doc.text('Total', COLS.total, ty, {
      width: RIGHT - COLS.total,
      align: 'right',
    });
    return y + h;
  }

  private tabla(doc: PDFKit.PDFDocument, v: SalesReportView): number {
    let y = this.cabeceraTabla(doc, 146);
    const rowH = 16;
    const limiteInferior = doc.page.height - MARGIN - 40;

    if (v.rows.length === 0) {
      doc
        .fillColor(COLOR.soft)
        .font('Helvetica-Oblique')
        .fontSize(9)
        .text('Sin ventas en el periodo.', MARGIN, y + 8, {
          width: RIGHT - MARGIN,
          align: 'center',
        });
      y += rowH + 8;
      doc.moveTo(MARGIN, y).lineTo(RIGHT, y).lineWidth(1).stroke(COLOR.line);
      return y;
    }

    v.rows.forEach((r, i) => {
      if (y + rowH > limiteInferior) {
        doc.addPage();
        y = this.cabeceraTabla(doc, MARGIN);
      }

      if (i % 2 === 1) {
        doc.rect(MARGIN, y, RIGHT - MARGIN, rowH).fill(COLOR.zebra);
      }

      const ty = y + 5;
      doc.fillColor(COLOR.ink).font('Helvetica').fontSize(8);
      doc.text(String(i + 1), COLS.item + 2, ty, {
        width: COLS.number - COLS.item - 4,
      });
      doc.text(r.saleNumber, COLS.number, ty, {
        width: COLS.date - COLS.number - 4,
        lineBreak: false,
      });
      doc.text(r.saleDate, COLS.date, ty, {
        width: COLS.client - COLS.date - 4,
      });
      // El nombre del cliente se recorta a una sola linea midiendo su ancho:
      // el `ellipsis` de pdfkit con `lineBreak:false` no trunca de forma fiable
      // y un nombre largo se partia en varias lineas, montandose sobre la fila.
      const clienteW = COLS.subtotal - COLS.client - 6;
      doc.text(
        this.recortar(doc, r.clientDescription, clienteW),
        COLS.client,
        ty,
        {
          width: clienteW,
          lineBreak: false,
        },
      );
      doc.text(this.money(r.subTotal), COLS.subtotal, ty, {
        width: COLS.igv - COLS.subtotal - 4,
        align: 'right',
      });
      doc.text(this.money(r.igv), COLS.igv, ty, {
        width: COLS.total - COLS.igv - 4,
        align: 'right',
      });
      doc.text(this.money(r.total), COLS.total, ty, {
        width: RIGHT - COLS.total,
        align: 'right',
      });
      y += rowH;
    });

    doc.moveTo(MARGIN, y).lineTo(RIGHT, y).lineWidth(1).stroke(COLOR.line);
    return y;
  }

  private totales(
    doc: PDFKit.PDFDocument,
    v: SalesReportView,
    tablaBottom: number,
  ): void {
    // Si no queda sitio para el bloque de totales, se pasa a una pagina nueva.
    let y = tablaBottom + 12;
    if (y + 76 > doc.page.height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    const x = 330;
    const w = RIGHT - x;

    const fila = (etiqueta: string, valor: string, fuerte = false): void => {
      doc
        .font(fuerte ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(fuerte ? 12 : 10)
        .fillColor(fuerte ? COLOR.ink : COLOR.soft)
        .text(etiqueta, x, y, { width: w / 2 })
        .fillColor(COLOR.ink)
        .text(this.money(valor), x + w / 2, y, {
          width: w / 2,
          align: 'right',
        });
      y += fuerte ? 22 : 18;
    };

    fila('Subtotal', v.totals.subTotal);
    fila('IGV (18%)', v.totals.igv);
    doc
      .moveTo(x, y + 2)
      .lineTo(RIGHT, y + 2)
      .lineWidth(1)
      .stroke(COLOR.line);
    y += 8;
    fila('TOTAL', v.totals.total, true);
  }

  private pie(doc: PDFKit.PDFDocument): void {
    const y = doc.page.height - MARGIN - 24;
    const generado = new Date().toISOString().slice(0, 19).replace('T', ' ');
    doc.moveTo(MARGIN, y).lineTo(RIGHT, y).lineWidth(1).stroke(COLOR.line);
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(8)
      .text(
        `Reporte generado automaticamente por AppSales el ${generado} UTC.`,
        MARGIN,
        y + 6,
        { width: RIGHT - MARGIN, align: 'center' },
      );
  }

  /**
   * Recorta un texto para que quepa en `width` en una sola linea, agregando "…"
   * si sobra. Mide con la fuente y tamano vigentes, asi que debe llamarse tras
   * fijarlos. Evita depender del `ellipsis` de pdfkit, que con `lineBreak:false`
   * no trunca de forma fiable.
   */
  private recortar(
    doc: PDFKit.PDFDocument,
    texto: string,
    width: number,
  ): string {
    if (doc.widthOfString(texto) <= width) return texto;
    const puntos = '…';
    let s = texto;
    while (s.length > 1 && doc.widthOfString(s + puntos) > width) {
      s = s.slice(0, -1);
    }
    return s + puntos;
  }

  /** Formatea una cadena decimal ("1059.64") como "S/ 1,059.64". */
  private money(decimal: string): string {
    const n = Number(decimal);
    const formateado = Number.isFinite(n)
      ? n.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : decimal;
    return `S/ ${formateado}`;
  }
}
