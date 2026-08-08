import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_BY_CLIENT_REPORT_EXCEL_RENDERER,
  SALES_BY_CLIENT_REPORT_READER,
} from '../domain/sales-by-client-report-view';
import type {
  SalesByClientReportExcelRenderer,
  SalesByClientReportReader,
} from '../domain/sales-by-client-report-view';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface SendSalesByClientReportExcelOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendSalesByClientReportExcelUseCase {
  constructor(
    @Inject(SALES_BY_CLIENT_REPORT_READER) private readonly reader: SalesByClientReportReader,
    @Inject(SALES_BY_CLIENT_REPORT_EXCEL_RENDERER) private readonly renderer: SalesByClientReportExcelRenderer,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async execute(
    email: string,
    clientId: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<SendSalesByClientReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(clientId, dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const logo = brandLogoPng();

    const slug = view.singleDay ? view.dateFrom : `${view.dateFrom}_${view.dateTo}`;
    const fileName = `ventas-cliente-${slug}.xlsx`;
    const periodo = view.singleDay ? `del día ${view.dateFrom}` : `del ${view.dateFrom} al ${view.dateTo}`;

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Cliente', value: view.clientDescription },
      { label: 'Comprobantes', value: `${view.totals.count}` },
      { label: 'Total', value: `S/ ${view.totals.amount}` },
    ];

    const html = buildEmailHtml({
      greeting: 'Hola,',
      paragraphs: [`Adjuntamos el detalle de ventas del cliente ${view.clientDescription} ${periodo} en Excel.`],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Ventas del cliente ${view.clientDescription} ${periodo}`,
      text: `Hola,\n\nAdjuntamos el detalle de ventas del cliente ${view.clientDescription} ${periodo} en Excel.\n\nMichael Dev S.A.C.`,
      html,
      attachments: [
        { filename: fileName, content: xlsx, contentType: XLSX_MIME },
        ...(logo ? [{ filename: 'logo.png', content: logo, contentType: 'image/png', cid: LOGO_CID }] : []),
      ],
    });

    return { to: email, messageId: result.messageId, sentAt: new Date().toISOString() };
  }
}
