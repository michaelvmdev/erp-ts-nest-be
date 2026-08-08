import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
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
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `monto-clientes-${view.dateFrom}.pdf`
      : `monto-clientes-${view.dateFrom}_${view.dateTo}.pdf`;

    const periodo = view.singleDay
      ? `del día ${view.dateFrom}`
      : `entre las fechas ${view.dateFrom} y ${view.dateTo}`;

    const { clientCount, amount } = view.totals;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Clientes', value: `${clientCount}` },
      { label: 'Total vendido', value: `S/ ${amount}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [
        `Adjuntamos el reporte de monto de venta por cliente ${periodo} en PDF.`,
      ],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de monto de venta de clientes ${periodo}`,
      text:
        `Hola,\n\n` +
        `Adjuntamos el reporte de monto de venta de clientes ${periodo} en PDF.\n\n` +
        `Resumen: ${clientCount} cliente${clientCount === 1 ? '' : 's'} nos compraron, ` +
        `total S/ ${amount}.\n\n` +
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
