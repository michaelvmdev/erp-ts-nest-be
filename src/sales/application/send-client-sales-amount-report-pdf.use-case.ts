import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import {
  CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER,
  CLIENT_SALES_AMOUNT_REPORT_READER,
} from '../domain/client-sales-amount-report-view';
import type {
  ClientSalesAmountReportPdfRenderer,
  ClientSalesAmountReportReader,
} from '../domain/client-sales-amount-report-view';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';

export interface SendClientSalesAmountReportOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendClientSalesAmountReportPdfUseCase {
  constructor(
    @Inject(CLIENT_SALES_AMOUNT_REPORT_READER)
    private readonly reader: ClientSalesAmountReportReader,
    @Inject(CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER)
    private readonly renderer: ClientSalesAmountReportPdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  async execute(
    email: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<SendClientSalesAmountReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to);

    const pdf = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `monto-clientes-${view.dateFrom}.pdf`
      : `monto-clientes-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del dia ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de monto de venta de clientes ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de monto de venta de clientes ${periodo} en PDF.\n\n` +
        `Resumen: ${view.totals.clientCount} cliente${view.totals.clientCount === 1 ? '' : 's'} ` +
        `nos compraron, total S/ ${view.totals.amount}.\n\n` +
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
