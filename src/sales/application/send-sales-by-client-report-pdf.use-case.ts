import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
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
    clientId: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<SendSalesByClientReportOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(clientId, dateFrom, to);
    const pdf = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `ventas-cliente-${view.dateFrom}.pdf`
      : `ventas-cliente-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del día ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const { count, amount } = view.totals;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Cliente', value: view.clientDescription },
      { label: 'Ventas', value: `${count}` },
      { label: 'Total', value: `S/ ${amount}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [
        `Adjuntamos el reporte de ventas del cliente ${view.clientDescription} ${periodo} en PDF.`,
      ],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de ventas del cliente ${view.clientDescription} ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de ventas del cliente ${view.clientDescription} ${periodo} en PDF.\n\n` +
        `Resumen: ${count} venta${count === 1 ? '' : 's'}, total S/ ${amount}.\n\n` +
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
