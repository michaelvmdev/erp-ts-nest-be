import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER,
  SUPPLIER_PURCHASES_AMOUNT_REPORT_READER,
} from '../domain/supplier-purchases-amount-report-view';
import type {
  SupplierPurchasesAmountReportExcelRenderer,
  SupplierPurchasesAmountReportReader,
} from '../domain/supplier-purchases-amount-report-view';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface SendSupplierPurchasesAmountReportExcelOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendSupplierPurchasesAmountReportExcelUseCase {
  constructor(
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_READER) private readonly reader: SupplierPurchasesAmountReportReader,
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER) private readonly renderer: SupplierPurchasesAmountReportExcelRenderer,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async execute(email: string, dateFrom: string, dateTo?: string): Promise<SendSupplierPurchasesAmountReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidPurchasesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `proveedores-monto-${view.dateFrom}.xlsx`
      : `proveedores-monto-${view.dateFrom}_${view.dateTo}.xlsx`;
    const periodo = view.singleDay ? `del día ${view.dateFrom}` : `del ${view.dateFrom} al ${view.dateTo}`;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Proveedores', value: `${view.totals.supplierCount}` },
      { label: 'Total comprado', value: `S/ ${view.totals.amount}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [`Adjuntamos el reporte de monto de compras por proveedor ${periodo} en Excel.`],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de compras por proveedor ${periodo}`,
      text: `Hola,\n\nAdjuntamos el reporte de monto de compras por proveedor ${periodo} en Excel.\n\nMichael Dev S.A.C.`,
      html,
      attachments: [
        { filename: fileName, content: xlsx, contentType: XLSX_MIME },
        ...(logo ? [{ filename: 'logo.png', content: logo, contentType: 'image/png', cid: LOGO_CID }] : []),
      ],
    });

    return { to: email, messageId: result.messageId, sentAt: new Date().toISOString() };
  }
}
