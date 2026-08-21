import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

const COLOR = {
  ink:     '#1f2733',
  soft:    '#6b7280',
  accent:  '#1e3a5f',
  line:    '#d7dbe0',
  headFill:'#1e3a5f',
  headText:'#ffffff',
  zebra:   '#f5f6f8',
};

const M  = 36;
const PAGE_W = 841; // A4 landscape
const W  = PAGE_W - 2 * M;

const COLS = {
  num:     M,                  // #
  name:    M + 22,             // Apellidos y Nombres
  doc:     M + 190,            // Doc.
  cargo:   M + 240,            // Cargo
  pension: M + 310,            // AFP/ONP
  bruto:   M + 370,            // Bruto
  pension$:M + 418,            // Aporte pension
  essalud: M + 470,            // EsSalud
  net:     M + 520,            // Neto
  cts:     M + 572,            // CTS
  grat:    M + 622,            // Grat.
  dias:    W + M - 26,         // Días
} as const;

export interface PlameLine {
  num:              number;
  employeeName:     string;
  documentType:     string;
  documentNumber:   string;
  position:         string;
  pensionSystem:    string;
  afpName:          string | null;
  grossSalary:      number;
  pensionDeduction: number;
  essalud:          number;
  netSalary:        number;
  ctsProvision:     number;
  gratificationProv:number;
  daysWorked:       number;
}

export interface PlameView {
  period:    string;
  totalGross:number;
  totalDeductions:number;
  totalNet:  number;
  lines:     PlameLine[];
}

@Injectable()
export class PlamePdfGenerator {
  render(v: PlameView): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: M });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        this.header(doc, v);
        let y = this.cabeceraTabla(doc, M + 90);
        for (const line of v.lines) {
          if (y + 18 > doc.page.height - M - 60) {
            doc.addPage({ size: 'A4', layout: 'landscape', margin: M });
            y = this.cabeceraTabla(doc, M);
          }
          y = this.fila(doc, line, y);
        }
        this.totales(doc, v, y);
        this.footer(doc);
        doc.end();
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  private header(doc: PDFKit.PDFDocument, v: PlameView): void {
    doc.fillColor(COLOR.accent).font('Helvetica-Bold').fontSize(14)
      .text('PLANILLA ELECTRÓNICA — PLAME', M, M);
    doc.fillColor(COLOR.soft).font('Helvetica').fontSize(9)
      .text(`Michael Dev S.A.C.  |  RUC: 20601054702  |  Período: ${v.period}  |  ${v.lines.length} trabajadores`,
        M, M + 18);
    doc.moveTo(M, M + 36).lineTo(M + W, M + 36).lineWidth(1).stroke(COLOR.line);

    // Resumen
    const sy = M + 44;
    const boxes = [
      { label: 'Total haberes brutos',  val: v.totalGross       },
      { label: 'Total descuentos',      val: v.totalDeductions   },
      { label: 'Total neto a pagar',    val: v.totalNet          },
    ];
    boxes.forEach(({ label, val }, i) => {
      const bx = M + i * 240;
      doc.roundedRect(bx, sy, 220, 36, 4).lineWidth(0.5).stroke(COLOR.line);
      doc.fillColor(COLOR.soft).font('Helvetica').fontSize(7).text(label, bx + 8, sy + 6);
      doc.fillColor(COLOR.ink).font('Helvetica-Bold').fontSize(12)
        .text(this.fmt(val), bx + 8, sy + 18);
    });
  }

  private cabeceraTabla(doc: PDFKit.PDFDocument, y: number): number {
    const h = 20;
    doc.rect(M, y, W, h).fill(COLOR.headFill);
    doc.fillColor(COLOR.headText).font('Helvetica-Bold').fontSize(7);
    const ty = y + 6;
    doc.text('#',              COLS.num,     ty);
    doc.text('Apellidos y Nombres', COLS.name, ty, { width: 65 });
    doc.text('Doc.',           COLS.doc,     ty, { width: 44 });
    doc.text('Cargo',          COLS.cargo,   ty, { width: 65 });
    doc.text('Sistem.',        COLS.pension, ty, { width: 55 });
    doc.text('Bruto',          COLS.bruto,   ty, { width: 44, align: 'right' });
    doc.text('AFP/ONP',        COLS['pension$'], ty, { width: 48, align: 'right' });
    doc.text('EsSalud',        COLS.essalud, ty, { width: 46, align: 'right' });
    doc.text('Neto',           COLS.net,     ty, { width: 48, align: 'right' });
    doc.text('CTS',            COLS.cts,     ty, { width: 46, align: 'right' });
    doc.text('Gratif.',        COLS.grat,    ty, { width: 46, align: 'right' });
    doc.text('Días',           COLS.dias,    ty, { width: 26, align: 'right' });
    return y + h;
  }

  private fila(doc: PDFKit.PDFDocument, l: PlameLine, y: number): number {
    const h = 17;
    if (l.num % 2 === 0) doc.rect(M, y, W, h).fill(COLOR.zebra);
    doc.fillColor(COLOR.ink).font('Helvetica').fontSize(7);
    const ty = y + 5;
    doc.text(String(l.num),          COLS.num,     ty);
    doc.text(l.employeeName,         COLS.name,    ty, { width: 64, lineBreak: false, ellipsis: true });
    doc.text(`${l.documentType} ${l.documentNumber}`, COLS.doc, ty, { width: 44, lineBreak: false, ellipsis: true });
    doc.text(l.position,             COLS.cargo,   ty, { width: 64, lineBreak: false, ellipsis: true });
    const sist = l.pensionSystem === 'AFP' && l.afpName
      ? `AFP\n${l.afpName}`
      : l.pensionSystem;
    doc.text(sist,                   COLS.pension, ty, { width: 54, lineBreak: false, ellipsis: true });
    doc.text(this.fmt(l.grossSalary),      COLS.bruto,    ty, { width: 44, align: 'right' });
    doc.text(this.fmt(l.pensionDeduction), COLS['pension$'], ty, { width: 48, align: 'right' });
    doc.text(this.fmt(l.essalud),          COLS.essalud,  ty, { width: 46, align: 'right' });
    doc.text(this.fmt(l.netSalary),        COLS.net,      ty, { width: 48, align: 'right' });
    doc.text(this.fmt(l.ctsProvision),     COLS.cts,      ty, { width: 46, align: 'right' });
    doc.text(this.fmt(l.gratificationProv),COLS.grat,     ty, { width: 46, align: 'right' });
    doc.text(String(l.daysWorked),         COLS.dias,     ty, { width: 26, align: 'right' });
    return y + h;
  }

  private totales(doc: PDFKit.PDFDocument, v: PlameView, y: number): void {
    y += 6;
    doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).stroke(COLOR.line);
    y += 4;
    doc.fillColor(COLOR.ink).font('Helvetica-Bold').fontSize(8);
    doc.text('TOTALES',         COLS.name,    y);
    const totGross = v.lines.reduce((s, l) => s + l.grossSalary, 0);
    const totPens  = v.lines.reduce((s, l) => s + l.pensionDeduction, 0);
    const totEs    = v.lines.reduce((s, l) => s + l.essalud, 0);
    const totNet   = v.lines.reduce((s, l) => s + l.netSalary, 0);
    const totCts   = v.lines.reduce((s, l) => s + l.ctsProvision, 0);
    const totGrat  = v.lines.reduce((s, l) => s + l.gratificationProv, 0);
    doc.text(this.fmt(totGross), COLS.bruto,    y, { width: 44, align: 'right' });
    doc.text(this.fmt(totPens),  COLS['pension$'], y, { width: 48, align: 'right' });
    doc.text(this.fmt(totEs),    COLS.essalud,  y, { width: 46, align: 'right' });
    doc.text(this.fmt(totNet),   COLS.net,      y, { width: 48, align: 'right' });
    doc.text(this.fmt(totCts),   COLS.cts,      y, { width: 46, align: 'right' });
    doc.text(this.fmt(totGrat),  COLS.grat,     y, { width: 46, align: 'right' });
  }

  private footer(doc: PDFKit.PDFDocument): void {
    const y = doc.page.height - M - 14;
    doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).stroke(COLOR.line);
    doc.fillColor(COLOR.soft).font('Helvetica').fontSize(7)
      .text('Documento generado automáticamente por AppSales ERP. Solo de uso interno.',
        M, y + 4, { width: W, align: 'center' });
  }

  private fmt(n: number): string {
    return `S/ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
