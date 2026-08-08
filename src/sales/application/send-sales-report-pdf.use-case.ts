import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
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
    const pdf = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `ventas-${view.dateFrom}.pdf`
      : `ventas-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del día ${view.dateFrom}`
      : `del ${view.dateFrom} al ${view.dateTo}`;

    const count = view.totals.count;
    const summaryItems: EmailSummaryItem[] = [
      { label: 'Comprobantes', value: `${count}` },
      { label: 'Total', value: `S/ ${view.totals.total}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [`Adjuntamos el reporte de ventas ${periodo} en PDF.`],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de ventas ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de ventas ${periodo} en PDF.\n\n` +
        `Resumen: ${count} comprobante${count === 1 ? '' : 's'}, total S/ ${view.totals.total}.\n\n` +
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
