import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_BY_CLIENT_REPORT_PDF_RENDERER,
  SALES_BY_CLIENT_REPORT_READER,
} from '../domain/sales-by-client-report-view';
import type {
  SalesByClientReportPdfRenderer,
  SalesByClientReportReader,
} from '../domain/sales-by-client-report-view';

export interface SalesByClientReportPdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSalesByClientReportPdfUseCase {
  constructor(
    @Inject(SALES_BY_CLIENT_REPORT_READER)
    private readonly reader: SalesByClientReportReader,
    @Inject(SALES_BY_CLIENT_REPORT_PDF_RENDERER)
    private readonly renderer: SalesByClientReportPdfRenderer,
  ) {}

  async execute(
    dateFrom: string,
    dateTo?: string,
    clientId?: string,
  ): Promise<SalesByClientReportPdfOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to, clientId);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `ventas-cliente-${view.dateFrom}.pdf`
      : `ventas-cliente-${view.dateFrom}_${view.dateTo}.pdf`;

    return { fileName, base64: pdf.toString('base64') };
  }
}
