import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  CLIENT_SALES_AMOUNT_REPORT_EXCEL_RENDERER,
  CLIENT_SALES_AMOUNT_REPORT_READER,
} from '../domain/client-sales-amount-report-view';
import type {
  ClientSalesAmountReportExcelRenderer,
  ClientSalesAmountReportReader,
} from '../domain/client-sales-amount-report-view';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface SendClientSalesAmountReportExcelOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendClientSalesAmountReportExcelUseCase {
  constructor(
    @Inject(CLIENT_SALES_AMOUNT_REPORT_READER) private readonly reader: ClientSalesAmountReportReader,
    @Inject(CLIENT_SALES_AMOUNT_REPORT_EXCEL_RENDERER) private readonly renderer: ClientSalesAmountReportExcelRenderer,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async execute(email: string, dateFrom: string, dateTo?: string): Promise<SendClientSalesAmountReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const logo = brandLogoPng();

    const fileName = view.singleDay
      ? `clientes-monto-${view.dateFrom}.xlsx`
      : `clientes-monto-${view.dateFrom}_${view.dateTo}.xlsx`;
    const periodo = view.singleDay ? `del día ${view.dateFrom}` : `del ${view.dateFrom} al ${view.dateTo}`;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Clientes', value: `${view.totals.clientCount}` },
      { label: 'Total vendido', value: `S/ ${view.totals.amount}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [`Adjuntamos el reporte de monto de venta por cliente ${periodo} en Excel.`],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Reporte de monto por cliente ${periodo}`,
      text: `Hola,\n\nAdjuntamos el reporte de monto de venta por cliente ${periodo} en Excel.\n\nMichael Dev S.A.C.`,
      html,
      attachments: [
        { filename: fileName, content: xlsx, contentType: XLSX_MIME },
        ...(logo ? [{ filename: 'logo.png', content: logo, contentType: 'image/png', cid: LOGO_CID }] : []),
      ],
    });

    return { to: email, messageId: result.messageId, sentAt: new Date().toISOString() };
  }
}
