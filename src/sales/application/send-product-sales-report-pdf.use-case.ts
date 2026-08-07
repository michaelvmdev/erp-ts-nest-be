import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import {
  PRODUCT_SALES_REPORT_PDF_RENDERER,
  PRODUCT_SALES_REPORT_READER,
  ProductSalesReportOrderBy,
} from '../domain/product-sales-report-view';
import type {
  ProductSalesReportPdfRenderer,
  ProductSalesReportReader,
} from '../domain/product-sales-report-view';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';

export interface SendProductSalesReportOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendProductSalesReportPdfUseCase {
  constructor(
    @Inject(PRODUCT_SALES_REPORT_READER)
    private readonly reader: ProductSalesReportReader,
    @Inject(PRODUCT_SALES_REPORT_PDF_RENDERER)
    private readonly renderer: ProductSalesReportPdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  /**
   * `dateTo` es opcional: si se omite, el reporte —y el correo— son del dia
   * `dateFrom`. Las fechas llegan validadas como YYYY-MM-DD desde el DTO, asi que
   * la comparacion de cadenas equivale a comparar fechas. `orderBy` por defecto
   * es por monto.
   */
  async execute(
    email: string,
    dateFrom: string,
    dateTo?: string,
    orderBy: ProductSalesReportOrderBy = 'amount',
  ): Promise<SendProductSalesReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to, orderBy);

    // El PDF se genera en memoria y se adjunta tal cual: nunca toca el disco.
    const pdf = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `productos-vendidos-${view.dateFrom}.pdf`
      : `productos-vendidos-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del dia ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;
    const orden = view.orderBy === 'amount' ? 'monto' : 'cantidad';

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de productos vendidos ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de productos vendidos ${periodo} en PDF, ordenado por ${orden}.\n\n` +
        `Resumen: ${view.totals.productCount} producto${view.totals.productCount === 1 ? '' : 's'}, ` +
        `${view.totals.quantity} unidades, total S/ ${view.totals.total}.\n\n` +
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
