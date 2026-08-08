import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_REPORT_EXCEL_RENDERER,
  SALES_REPORT_READER,
} from '../domain/sales-report-view';
import type { SalesReportExcelRenderer, SalesReportReader } from '../domain/sales-report-view';

export interface SalesReportExcelOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSalesReportExcelUseCase {
  constructor(
    @Inject(SALES_REPORT_READER) private readonly reader: SalesReportReader,
    @Inject(SALES_REPORT_EXCEL_RENDERER) private readonly renderer: SalesReportExcelRenderer,
  ) {}

  async execute(dateFrom: string, dateTo?: string): Promise<SalesReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `ventas-${view.dateFrom}.xlsx`
      : `ventas-${view.dateFrom}_${view.dateTo}.xlsx`;
    return { fileName, base64: xlsx.toString('base64') };
  }
}
