import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
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
    const pdf = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `productos-vendidos-${view.dateFrom}.pdf`
      : `productos-vendidos-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del día ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const orden = view.orderBy === 'amount' ? 'monto' : 'cantidad';
    const { productCount, quantity, total } = view.totals;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Productos', value: `${productCount}` },
      { label: 'Unidades', value: `${quantity}` },
      { label: 'Total', value: `S/ ${total}` },
      { label: 'Ordenado por', value: orden },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [
        `Adjuntamos el reporte de productos vendidos ${periodo} en PDF, ordenado por ${orden}.`,
      ],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de productos vendidos ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de productos vendidos ${periodo} en PDF, ordenado por ${orden}.\n\n` +
        `Resumen: ${productCount} producto${productCount === 1 ? '' : 's'}, ` +
        `${quantity} unidades, total S/ ${total}.\n\n` +
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
