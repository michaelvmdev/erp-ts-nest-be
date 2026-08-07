import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_BY_CLIENT_REPORT_PDF_RENDERER,
  SALES_BY_CLIENT_REPORT_READER,
} from '../domain/sales-by-client-report-view';
import type {
  SalesByClientReportPdfRenderer,
  SalesByClientReportReader,
} from '../domain/sales-by-client-report-view';

export interface SendSalesByClientReportOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendSalesByClientReportPdfUseCase {
  constructor(
    @Inject(SALES_BY_CLIENT_REPORT_READER)
    private readonly reader: SalesByClientReportReader,
    @Inject(SALES_BY_CLIENT_REPORT_PDF_RENDERER)
    private readonly renderer: SalesByClientReportPdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  async execute(
    email: string,
    dateFrom: string,
    dateTo?: string,
    clientId?: string,
  ): Promise<SendSalesByClientReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to, clientId);

    const pdf = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `ventas-cliente-${view.dateFrom}.pdf`
      : `ventas-cliente-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del dia ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;
    const alcance = view.clientDescription
      ? ` del cliente ${view.clientDescription}`
      : '';

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de ventas por cliente ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de ventas por cliente${alcance} ${periodo} en PDF.\n\n` +
        `Resumen: ${view.totals.count} venta${view.totals.count === 1 ? '' : 's'}, ` +
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
