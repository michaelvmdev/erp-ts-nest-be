import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { brandLogoPng } from '../../../shared/infrastructure/assets';
import { SalePdfRenderer, SalePrintView } from '../../domain/sale-print-view';

/** Paleta y medidas del comprobante, en un solo lugar. */
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
const COLS = {
  item: MARGIN, // #
  name: MARGIN + 34, // Producto
  qty: 350, // Cant.
  price: 398, // P. Unit.
  partial: 470, // Parcial
} as const;

/**
 * Dibuja el comprobante de una venta en un PDF y lo devuelve como Buffer.
 *
 * pdfkit escribe en un stream; aca se juntan sus chunks en memoria y nunca se
 * toca el disco, que es justo lo que necesitan tanto la respuesta en base64 como
 * el adjunto del correo. Cada llamada crea su propio documento: el generador no
 * guarda estado y es seguro de reutilizar.
 */
@Injectable()
export class SalePdfGenerator implements SalePdfRenderer {
  render(view: SalePrintView): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.encabezado(doc, view);
        this.datosCliente(doc, view);
        const tablaBottom = this.tabla(doc, view);
        this.totales(doc, view, tablaBottom);
        this.pie(doc);
        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private get right(): number {
    return 545; // A4 (595) menos el margen derecho.
  }

  private encabezado(doc: PDFKit.PDFDocument, v: SalePrintView): void {
    // Logo de la marca a la izquierda si esta disponible; el emisor se corre a
    // su derecha. Si el logo falta, el texto ocupa el margen como antes.
    const logo = brandLogoPng();
    let textoX = MARGIN;
    if (logo) {
      doc.image(logo, MARGIN, MARGIN - 2, { width: 46 });
      textoX = MARGIN + 58;
    }

    // Emisor: la empresa que emite el comprobante.
    doc
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('Michael Dev S.A.C.', textoX, MARGIN);
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(9)
      .text('Tienda de tecnologia', textoX, MARGIN + 24)
      .text('RUC 20601054702', textoX, MARGIN + 36);

    // Recuadro del comprobante a la derecha.
    const bx = 360;
    const bw = this.right - bx;
    doc.roundedRect(bx, MARGIN, bw, 66, 6).lineWidth(1).stroke(COLOR.accent);
    doc
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(v.saleTypeDescription.toUpperCase(), bx, MARGIN + 8, {
        width: bw,
        align: 'center',
      });
    doc
      .fillColor(COLOR.ink)
      .fontSize(13)
      .text(v.saleNumber, bx, MARGIN + 26, { width: bw, align: 'center' });
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(9)
      .text(`Emitido: ${v.saleDate}  ${v.saleHour}`, bx, MARGIN + 48, {
        width: bw,
        align: 'center',
      });

    doc
      .moveTo(MARGIN, 132)
      .lineTo(this.right, 132)
      .lineWidth(1)
      .stroke(COLOR.line);
  }

  private datosCliente(doc: PDFKit.PDFDocument, v: SalePrintView): void {
    const y = 146;
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('CLIENTE', MARGIN, y)
      .text('LOCALIDAD', 320, y);

    doc
      .fillColor(COLOR.ink)
      .font('Helvetica')
      .fontSize(10)
      .text(v.client.description, MARGIN, y + 12, { width: 250 })
      .fillColor(COLOR.soft)
      .fontSize(9)
      .text(
        `${v.client.documentType}: ${v.client.documentNumber}`,
        MARGIN,
        y + 26,
      );

    doc
      .fillColor(COLOR.ink)
      .fontSize(10)
      .text(v.location.districtDescription, 320, y + 12, { width: 225 })
      .fillColor(COLOR.soft)
      .fontSize(9)
      .text(
        `${v.location.provinceDescription}, ${v.location.departmentDescription}`,
        320,
        y + 26,
        { width: 225 },
      );
  }

  private cabeceraTabla(doc: PDFKit.PDFDocument, y: number): number {
    const h = 20;
    doc.rect(MARGIN, y, this.right - MARGIN, h).fill(COLOR.headFill);
    doc.fillColor(COLOR.headText).font('Helvetica-Bold').fontSize(9);
    const ty = y + 6;
    doc.text('#', COLS.item + 2, ty);
    doc.text('Producto', COLS.name, ty);
    doc.text('Cant.', COLS.qty, ty, { width: 40, align: 'right' });
    doc.text('P. Unit.', COLS.price, ty, { width: 60, align: 'right' });
    doc.text('Parcial', COLS.partial, ty, {
      width: this.right - COLS.partial,
      align: 'right',
    });
    return y + h;
  }

  private tabla(doc: PDFKit.PDFDocument, v: SalePrintView): number {
    let y = this.cabeceraTabla(doc, 194);
    const rowH = 20;
    const limiteInferior = doc.page.height - MARGIN - 140; // deja sitio a totales.

    v.lines.forEach((l, i) => {
      if (y + rowH > limiteInferior) {
        doc.addPage();
        y = this.cabeceraTabla(doc, MARGIN);
      }

      if (i % 2 === 1) {
        doc.rect(MARGIN, y, this.right - MARGIN, rowH).fill(COLOR.zebra);
      }

      const ty = y + 6;
      doc.fillColor(COLOR.ink).font('Helvetica').fontSize(9);
      doc.text(String(l.item), COLS.item + 2, ty);
      doc.text(l.productName, COLS.name, ty, {
        width: COLS.qty - COLS.name - 8,
        ellipsis: true,
        lineBreak: false,
      });
      doc.text(String(l.quantity), COLS.qty, ty, { width: 40, align: 'right' });
      doc.text(this.money(l.unitPrice), COLS.price, ty, {
        width: 60,
        align: 'right',
      });
      doc.text(this.money(l.partial), COLS.partial, ty, {
        width: this.right - COLS.partial,
        align: 'right',
      });
      y += rowH;
    });

    doc.moveTo(MARGIN, y).lineTo(this.right, y).lineWidth(1).stroke(COLOR.line);
    return y;
  }

  private totales(
    doc: PDFKit.PDFDocument,
    v: SalePrintView,
    tablaBottom: number,
  ): void {
    const x = 330;
    const w = this.right - x;
    let y = tablaBottom + 14;

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

    fila('Subtotal', v.subTotal);
    fila('IGV (18%)', v.igv);
    doc
      .moveTo(x, y + 2)
      .lineTo(this.right, y + 2)
      .lineWidth(1)
      .stroke(COLOR.line);
    y += 8;
    fila('TOTAL', v.total, true);
  }

  private pie(doc: PDFKit.PDFDocument): void {
    const y = doc.page.height - MARGIN - 24;
    doc.moveTo(MARGIN, y).lineTo(this.right, y).lineWidth(1).stroke(COLOR.line);
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'Documento generado automaticamente por AppSales. Representacion impresa del comprobante electronico.',
        MARGIN,
        y + 6,
        { width: this.right - MARGIN, align: 'center' },
      );
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
