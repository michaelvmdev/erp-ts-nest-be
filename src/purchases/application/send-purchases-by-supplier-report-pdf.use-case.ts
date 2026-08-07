import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER,
  PURCHASES_BY_SUPPLIER_REPORT_READER,
} from '../domain/purchases-by-supplier-report-view';
import type {
  PurchasesBySupplierReportPdfRenderer,
  PurchasesBySupplierReportReader,
} from '../domain/purchases-by-supplier-report-view';

export interface SendPurchasesBySupplierReportOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendPurchasesBySupplierReportPdfUseCase {
  constructor(
    @Inject(PURCHASES_BY_SUPPLIER_REPORT_READER)
    private readonly reader: PurchasesBySupplierReportReader,
    @Inject(PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER)
    private readonly renderer: PurchasesBySupplierReportPdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  async execute(
    email: string,
    supplierId: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<SendPurchasesBySupplierReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidPurchasesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(supplierId, dateFrom, to);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `compras-proveedor-${view.dateFrom}.pdf`
      : `compras-proveedor-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del dia ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de compras del proveedor ${view.supplierDescription} ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de compras del proveedor ${view.supplierDescription} ${periodo} en PDF.\n\n` +
        `Resumen: ${view.totals.count} compra${view.totals.count === 1 ? '' : 's'}, ` +
        `total S/ ${view.totals.amount}.\n\n` +
        'Michael Dev S.A.C.\nEnviado con AppSales',
      attachments: [
        { filename: fileName, content: pdf, contentType: 'application/pdf' },
      ],
    });

    return {
      to: email,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    };
  }
}
