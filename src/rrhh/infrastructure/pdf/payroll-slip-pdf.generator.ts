import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

const COLOR = {
  ink:     '#1f2733',
  soft:    '#6b7280',
  accent:  '#2f3a4a',
  line:    '#d7dbe0',
  headFill:'#2f3a4a',
  headText:'#ffffff',
  zebra:   '#f5f6f8',
  green:   '#047857',
  red:     '#b91c1c',
};

const M  = 50;
const W  = 495; // 595 - 2*50
const MID = M + W / 2 + 10;

export interface BoletaView {
  period:          string;
  employeeName:    string;
  position:        string;
  pensionSystem:   string;
  afpName:         string | null;
  documentType:    string;
  documentNumber:  string;
  daysWorked:      number;
  basicSalary:     number;
  familyAllowance: number;
  overtime:        number;
  grossSalary:     number;
  pensionDeduction:number;
  essalud:         number;
  incomeTax:       number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary:       number;
  ctsProvision:    number;
  gratificationProv:number;
}

@Injectable()
export class PayrollSlipPdfGenerator {
  render(v: BoletaView): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: M });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        this.header(doc, v);
        this.empleado(doc, v);
        this.tablaHaberes(doc, v);
        this.footer(doc, v);
        doc.end();
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  private header(doc: PDFKit.PDFDocument, v: BoletaView): void {
    doc.fillColor(COLOR.accent).font('Helvetica-Bold').fontSize(18)
      .text('Michael Dev S.A.C.', M, M);
    doc.fillColor(COLOR.soft).font('Helvetica').fontSize(9)
      .text('RUC 20601054702', M, M + 22)
      .text('Documento interno — Boleta de pago', M, M + 34);

    const bx = 380, bw = 165;
    doc.roundedRect(bx, M, bw, 56, 5).lineWidth(1).stroke(COLOR.accent);
    doc.fillColor(COLOR.accent).font('Helvetica-Bold').fontSize(10)
      .text('BOLETA DE PAGO', bx, M + 8, { width: bw, align: 'center' });
    doc.fillColor(COLOR.ink).fontSize(13)
      .text(`Período: ${v.period}`, bx, M + 26, { width: bw, align: 'center' });
    doc.fillColor(COLOR.soft).font('Helvetica').fontSize(8)
      .text(`${v.daysWorked} días trabajados`, bx, M + 44, { width: bw, align: 'center' });

    doc.moveTo(M, M + 70).lineTo(M + W, M + 70).lineWidth(1).stroke(COLOR.line);
  }

  private empleado(doc: PDFKit.PDFDocument, v: BoletaView): void {
    const y = M + 82;
    this.labelVal(doc, 'EMPLEADO',       v.employeeName,  M,   y);
    this.labelVal(doc, 'CARGO',          v.position,      MID, y);
    this.labelVal(doc, 'DOCUMENTO',      `${v.documentType}: ${v.documentNumber}`, M, y + 34);
    this.labelVal(doc, 'SISTEMA PENSION',
      v.pensionSystem === 'AFP' && v.afpName
        ? `AFP – ${v.afpName}`
        : v.pensionSystem,
      MID, y + 34);

    doc.moveTo(M, y + 68).lineTo(M + W, y + 68).lineWidth(1).stroke(COLOR.line);
  }

  private labelVal(doc: PDFKit.PDFDocument, label: string, val: string, x: number, y: number): void {
    doc.fillColor(COLOR.soft).font('Helvetica-Bold').fontSize(7).text(label, x, y);
    doc.fillColor(COLOR.ink).font('Helvetica').fontSize(10).text(val, x, y + 11);
  }

  private tablaHaberes(doc: PDFKit.PDFDocument, v: BoletaView): void {
    const startY = M + 168;
    const colW   = W / 2 - 10;

    // — Haberes —
    let y = this.seccion(doc, 'HABERES', M, startY, colW);
    y = this.filaTabla(doc, 'Sueldo básico',       v.basicSalary,     M, y, colW, false);
    if (v.familyAllowance > 0)
      y = this.filaTabla(doc, 'Asignación familiar', v.familyAllowance, M, y, colW, false);
    if (v.overtime > 0)
      y = this.filaTabla(doc, 'Horas extra',          v.overtime,        M, y, colW, false);
    y = this.filaTabla(doc, 'TOTAL HABERES',         v.grossSalary,     M, y, colW, true);

    // — Descuentos —
    const dx = M + colW + 20;
    let dy = this.seccion(doc, 'DESCUENTOS', dx, startY, colW);
    const pension = v.pensionSystem === 'AFP' ? `AFP (13%)` : `ONP (13%)`;
    dy = this.filaTabla(doc, pension,            v.pensionDeduction, dx, dy, colW, false);
    if (v.incomeTax > 0)
      dy = this.filaTabla(doc, 'Imp. renta 5ta cat.', v.incomeTax,       dx, dy, colW, false);
    if (v.otherDeductions > 0)
      dy = this.filaTabla(doc, 'Otros descuentos',    v.otherDeductions, dx, dy, colW, false);
    dy = this.filaTabla(doc, 'TOTAL DESCUENTOS',     v.totalDeductions, dx, dy, colW, true);

    // — EsSalud / provisiones (full width) —
    const provY = Math.max(y, dy) + 20;
    doc.moveTo(M, provY - 8).lineTo(M + W, provY - 8).lineWidth(0.5).stroke(COLOR.line);

    let py = this.seccion(doc, 'APORTE EMPLEADOR / PROVISIONES', M, provY, W);
    py = this.filaTabla(doc, `EsSalud (9% – costo empleador)`, v.essalud,           M, py, W, false);
    py = this.filaTabla(doc, 'Provisión CTS',                   v.ctsProvision,      M, py, W, false);
    py = this.filaTabla(doc, 'Provisión gratificación',          v.gratificationProv, M, py, W, false);

    // — Neto a pagar —
    const netY = py + 16;
    doc.rect(M, netY, W, 28).fill('#f0fdf4');
    doc.fillColor(COLOR.green).font('Helvetica-Bold').fontSize(11)
      .text('NETO A PAGAR:', M + 8, netY + 8)
      .text(this.fmt(v.netSalary), M, netY + 8, { width: W - 8, align: 'right' });
  }

  private seccion(doc: PDFKit.PDFDocument, title: string, x: number, y: number, w: number): number {
    doc.rect(x, y, w, 18).fill(COLOR.headFill);
    doc.fillColor(COLOR.headText).font('Helvetica-Bold').fontSize(8)
      .text(title, x + 4, y + 5);
    return y + 18;
  }

  private filaTabla(
    doc: PDFKit.PDFDocument, label: string, amount: number,
    x: number, y: number, w: number, bold: boolean,
  ): number {
    const even = Math.floor((y - M) / 18) % 2 === 0;
    if (even) doc.rect(x, y, w, 18).fill(COLOR.zebra);
    doc.fillColor(COLOR.ink)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 9 : 8.5)
      .text(label, x + 4, y + 5)
      .text(this.fmt(amount), x, y + 5, { width: w - 4, align: 'right' });
    return y + 18;
  }

  private footer(doc: PDFKit.PDFDocument, _v: BoletaView): void {
    const y = doc.page.height - M - 20;
    doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).stroke(COLOR.line);
    doc.fillColor(COLOR.soft).font('Helvetica').fontSize(7)
      .text(
        'Documento generado automáticamente por AppSales ERP. Solo de uso interno.',
        M, y + 6, { width: W, align: 'center' },
      );
  }

  private fmt(n: number): string {
    return `S/ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
