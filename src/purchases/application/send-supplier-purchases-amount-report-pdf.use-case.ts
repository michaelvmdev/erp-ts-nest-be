import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
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

    const fileName = view.singleDay
      ? `monto-proveedores-${view.dateFrom}.pdf`
      : `monto-proveedores-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del dia ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de monto de compras por proveedor ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de monto de compras por proveedor ${periodo} en PDF.\n\n` +
        `Resumen: ${view.totals.supplierCount} proveedor${view.totals.supplierCount === 1 ? '' : 'es'} ` +
        `con compras, total S/ ${view.totals.amount}.\n\n` +
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
