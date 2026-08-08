import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_BY_CLIENT_REPORT_EXCEL_RENDERER,
  SALES_BY_CLIENT_REPORT_READER,
} from '../domain/sales-by-client-report-view';
import type {
  SalesByClientReportExcelRenderer,
  SalesByClientReportReader,
} from '../domain/sales-by-client-report-view';

export interface SalesByClientReportExcelOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSalesByClientReportExcelUseCase {
  constructor(
    @Inject(SALES_BY_CLIENT_REPORT_READER) private readonly reader: SalesByClientReportReader,
    @Inject(SALES_BY_CLIENT_REPORT_EXCEL_RENDERER) private readonly renderer: SalesByClientReportExcelRenderer,
  ) {}

  async execute(clientId: string, dateFrom: string, dateTo?: string): Promise<SalesByClientReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(clientId, dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const slug = view.singleDay ? view.dateFrom : `${view.dateFrom}_${view.dateTo}`;
    const fileName = `ventas-cliente-${slug}.xlsx`;
    return { fileName, base64: xlsx.toString('base64') };
  }
}
