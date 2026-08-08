import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  PRODUCT_SALES_REPORT_EXCEL_RENDERER,
  PRODUCT_SALES_REPORT_READER,
} from '../domain/product-sales-report-view';
import type {
  ProductSalesReportExcelRenderer,
  ProductSalesReportOrderBy,
  ProductSalesReportReader,
} from '../domain/product-sales-report-view';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface SendProductSalesReportExcelOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendProductSalesReportExcelUseCase {
  constructor(
    @Inject(PRODUCT_SALES_REPORT_READER) private readonly reader: ProductSalesReportReader,
    @Inject(PRODUCT_SALES_REPORT_EXCEL_RENDERER) private readonly renderer: ProductSalesReportExcelRenderer,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async execute(
    email: string,
    dateFrom: string,
    dateTo?: string,
    orderBy: ProductSalesReportOrderBy = 'amount',
  ): Promise<SendProductSalesReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to, orderBy);
    const xlsx = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `productos-${view.dateFrom}.xlsx`
      : `productos-${view.dateFrom}_${view.dateTo}.xlsx`;
    const periodo = view.singleDay ? `del día ${view.dateFrom}` : `del ${view.dateFrom} al ${view.dateTo}`;
    const ordenLabel = orderBy === 'amount' ? 'monto' : 'cantidad';

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Productos', value: `${view.totals.productCount}` },
      { label: 'Unidades', value: `${view.totals.quantity}` },
      { label: 'Total', value: `S/ ${view.totals.total}` },
      { label: 'Ordenado por', value: ordenLabel },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [`Adjuntamos el reporte de productos vendidos ${periodo} en Excel.`],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de productos vendidos ${periodo}`,
      text: `Hola,\n\nAdjuntamos el reporte de productos vendidos ${periodo} en Excel.\n\nMichael Dev S.A.C.`,
      html,
      attachments: [
        { filename: fileName, content: xlsx, contentType: XLSX_MIME },
        ...(logo ? [{ filename: 'logo.png', content: logo, contentType: 'image/png', cid: LOGO_CID }] : []),
      ],
    });

    return { to: email, messageId: result.messageId, sentAt: new Date().toISOString() };
  }
}
