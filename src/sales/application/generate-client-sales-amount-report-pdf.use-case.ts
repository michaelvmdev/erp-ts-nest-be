import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER,
  CLIENT_SALES_AMOUNT_REPORT_READER,
} from '../domain/client-sales-amount-report-view';
import type {
  ClientSalesAmountReportPdfRenderer,
  ClientSalesAmountReportReader,
} from '../domain/client-sales-amount-report-view';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';

export interface ClientSalesAmountReportPdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateClientSalesAmountReportPdfUseCase {
  constructor(
    @Inject(CLIENT_SALES_AMOUNT_REPORT_READER)
    private readonly reader: ClientSalesAmountReportReader,
    @Inject(CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER)
    private readonly renderer: ClientSalesAmountReportPdfRenderer,
  ) {}

  async execute(
    dateFrom: string,
    dateTo?: string,
  ): Promise<ClientSalesAmountReportPdfOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `monto-clientes-${view.dateFrom}.pdf`
      : `monto-clientes-${view.dateFrom}_${view.dateTo}.pdf`;

    return { fileName, base64: pdf.toString('base64') };
  }
}
