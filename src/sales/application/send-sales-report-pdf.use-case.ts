import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_REPORT_PDF_RENDERER,
  SALES_REPORT_READER,
} from '../domain/sales-report-view';
import type {
  SalesReportPdfRenderer,
  SalesReportReader,
} from '../domain/sales-report-view';

export interface SendSalesReportOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendSalesReportPdfUseCase {
  constructor(
    @Inject(SALES_REPORT_READER)
    private readonly reader: SalesReportReader,
    @Inject(SALES_REPORT_PDF_RENDERER)
    private readonly renderer: SalesReportPdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  /**
   * `dateTo` es opcional: si se omite, el reporte —y el correo— son del dia
   * `dateFrom`. Las fechas llegan validadas como YYYY-MM-DD desde el DTO, asi que
   * la comparacion de cadenas equivale a comparar fechas.
   */
  async execute(
    email: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<SendSalesReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to);

    // El PDF se genera en memoria y se adjunta tal cual: nunca toca el disco.
    const pdf = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `ventas-${view.dateFrom}.pdf`
      : `ventas-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del dia ${view.dateFrom}`
      : `del ${view.dateFrom} al ${view.dateTo}`;

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de ventas ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de ventas ${periodo} en PDF.\n\n` +
        `Resumen: ${view.totals.count} comprobante${view.totals.count === 1 ? '' : 's'}, ` +
        `total S/ ${view.totals.total}.\n\n` +
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
