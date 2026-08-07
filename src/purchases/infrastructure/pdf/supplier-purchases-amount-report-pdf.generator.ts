import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { brandLogoPng } from '../../../shared/infrastructure/assets';
import {
  SupplierPurchasesAmountReportPdfRenderer,
  SupplierPurchasesAmountReportView,
} from '../../domain/supplier-purchases-amount-report-view';

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
const RIGHT = 545;

const COLS = {
  item: MARGIN,
  supplier: 74,
  igv: 340,
  amount: 440,
} as const;

@Injectable()
export class SupplierPurchasesAmountReportPdfGenerator
  implements SupplierPurchasesAmountReportPdfRenderer
{
  render(view: SupplierPurchasesAmountReportView): Promise<Buffer> {
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

  private encabezado(
    doc: PDFKit.PDFDocument,
    v: SupplierPurchasesAmountReportView,
  ): void {
    const logo = brandLogoPng();
    let textoX = MARGIN;
    if (logo) {
      doc.image(logo, MARGIN, MARGIN - 2, { width: 46 });
      textoX = MARGIN + 58;
    }

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

    const bx = 340;
    const bw = RIGHT - bx;
    doc.roundedRect(bx, MARGIN, bw, 66, 6).lineWidth(1).stroke(COLOR.accent);
    doc
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('MONTO POR PROVEEDOR', bx, MARGIN + 8, {
        width: bw,
        align: 'center',
      });
    doc
      .fillColor(COLOR.ink)
      .fontSize(12)
      .text(
        v.singleDay ? v.dateFrom : `${v.dateFrom}  a  ${v.dateTo}`,
        bx,
        MARGIN + 26,
        { width: bw, align: 'center' },
      );
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(9)
      .text(
        `${v.totals.supplierCount} proveedor${v.totals.supplierCount === 1 ? '' : 'es'}`,
        bx,
        MARGIN + 48,
        { width: bw, align: 'center' },
      );

    doc.moveTo(MARGIN, 132).lineTo(RIGHT, 132).lineWidth(1).stroke(COLOR.line);

    const titulo = v.singleDay
      ? `Monto de compra por proveedor del dia ${v.dateFrom}`
      : `Monto de compra por proveedor entre las fechas ${v.dateFrom} y ${v.dateTo}`;
    doc
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(titulo, MARGIN, 140, { width: RIGHT - MARGIN });
    doc
      .fillColor(COLOR.soft)
      .font('Helvetica')
      .fontSize(9)
      .text(
        'Proveedores a los que compramos en el periodo, ordenados por monto.',
        MARGIN,
        156,
        { width: RIGHT - MARGIN },
      );
  }

  private cabeceraTabla(doc: PDFKit.PDFDocument, y: number): number {
    const h = 20;
    doc.rect(MARGIN, y, RIGHT - MARGIN, h).fill(COLOR.headFill);
    doc.fillColor(COLOR.headText).font('Helvetica-Bold').fontSize(8);
    const ty = y + 7;
    doc.text('#', COLS.item + 2, ty);
    doc.text('Proveedor', COLS.supplier, ty);
    doc.text('IGV', COLS.igv, ty, {
      width: COLS.amount - COLS.igv - 8,
      align: 'right',
    });
    doc.text('Monto', COLS.amount, ty, {
      width: RIGHT - COLS.amount,
      align: 'right',
    });
    return y + h;
  }

  private tabla(
    doc: PDFKit.PDFDocument,
    v: SupplierPurchasesAmountReportView,
  ): number {
    let y = this.cabeceraTabla(doc, 178);
    const rowH = 16;
    const limiteInferior = doc.page.height - MARGIN - 40;

    if (v.rows.length === 0) {
      doc
        .fillColor(COLOR.soft)
        .font('Helvetica-Oblique')
        .fontSize(9)
        .text('Sin compras en el periodo.', MARGIN, y + 8, {
          width: RIGHT - MARGIN,
          align: 'center',
        });
      y += rowH + 8;
      doc.moveTo(MARGIN, y).lineTo(RIGHT, y).lineWidth(1).stroke(COLOR.line);
      return y;
    }

    const proveedorW = COLS.igv - COLS.supplier - 6;

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
        width: COLS.supplier - COLS.item - 4,
      });
      doc.text(
        this.recortar(doc, r.supplierDescription, proveedorW),
        COLS.supplier,
        ty,
        {
          width: proveedorW,
          lineBreak: false,
        },
      );
      doc.text(this.money(r.igv), COLS.igv, ty, {
        width: COLS.amount - COLS.igv - 8,
        align: 'right',
      });
      doc.text(this.money(r.amount), COLS.amount, ty, {
        width: RIGHT - COLS.amount,
        align: 'right',
      });
      y += rowH;
    });

    doc.moveTo(MARGIN, y).lineTo(RIGHT, y).lineWidth(1).stroke(COLOR.line);
    return y;
  }

  private totales(
    doc: PDFKit.PDFDocument,
    v: SupplierPurchasesAmountReportView,
    tablaBottom: number,
  ): void {
    if (v.rows.length === 0) return;

    let y = tablaBottom + 6;
    if (y + 22 > doc.page.height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    const ty = y + 5;
    doc.fillColor(COLOR.ink).font('Helvetica-Bold').fontSize(9);
    doc.text('TOTALES', COLS.supplier, ty);
    doc.text(this.money(v.totals.igv), COLS.igv, ty, {
      width: COLS.amount - COLS.igv - 8,
      align: 'right',
    });
    doc.text(this.money(v.totals.amount), COLS.amount, ty, {
      width: RIGHT - COLS.amount,
      align: 'right',
    });

    doc
      .moveTo(MARGIN, y + 20)
      .lineTo(RIGHT, y + 20)
      .lineWidth(1)
      .stroke(COLOR.line);
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
