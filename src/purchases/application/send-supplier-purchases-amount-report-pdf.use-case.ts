import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER,
  SUPPLIER_PURCHASES_AMOUNT_REPORT_READER,
} from '../domain/supplier-purchases-amount-report-view';
import type {
  SupplierPurchasesAmountReportPdfRenderer,
  SupplierPurchasesAmountReportReader,
} from '../domain/supplier-purchases-amount-report-view';

export interface SendSupplierPurchasesAmountReportOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendSupplierPurchasesAmountReportPdfUseCase {
  constructor(
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_READER)
    private readonly reader: SupplierPurchasesAmountReportReader,
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER)
    private readonly renderer: SupplierPurchasesAmountReportPdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  async execute(
    email: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<SendSupplierPurchasesAmountReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidPurchasesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to);
    const pdf = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `monto-proveedores-${view.dateFrom}.pdf`
      : `monto-proveedores-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del día ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const { supplierCount, amount } = view.totals;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Proveedores', value: `${supplierCount}` },
      { label: 'Total comprado', value: `S/ ${amount}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [
        `Adjuntamos el reporte de monto de compras por proveedor ${periodo} en PDF.`,
      ],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de monto de compras por proveedor ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de monto de compras por proveedor ${periodo} en PDF.\n\n` +
        `Resumen: ${supplierCount} proveedor${supplierCount === 1 ? '' : 'es'} con compras, ` +
        `total S/ ${amount}.\n\n` +
        'Michael Dev S.A.C.',
      html,
      attachments: [
        { filename: fileName, content: pdf, contentType: 'application/pdf' },
        ...(logo
          ? [{ filename: 'logo.png', content: logo, contentType: 'image/png', cid: LOGO_CID }]
          : []),
      ],
    });

    return {
      to: email,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    };
  }
}
