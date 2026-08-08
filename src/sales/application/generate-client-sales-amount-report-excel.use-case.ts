import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  CLIENT_SALES_AMOUNT_REPORT_EXCEL_RENDERER,
  CLIENT_SALES_AMOUNT_REPORT_READER,
} from '../domain/client-sales-amount-report-view';
import type {
  ClientSalesAmountReportExcelRenderer,
  ClientSalesAmountReportReader,
} from '../domain/client-sales-amount-report-view';

export interface ClientSalesAmountReportExcelOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateClientSalesAmountReportExcelUseCase {
  constructor(
    @Inject(CLIENT_SALES_AMOUNT_REPORT_READER) private readonly reader: ClientSalesAmountReportReader,
    @Inject(CLIENT_SALES_AMOUNT_REPORT_EXCEL_RENDERER) private readonly renderer: ClientSalesAmountReportExcelRenderer,
  ) {}

  async execute(dateFrom: string, dateTo?: string): Promise<ClientSalesAmountReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `clientes-monto-${view.dateFrom}.xlsx`
      : `clientes-monto-${view.dateFrom}_${view.dateTo}.xlsx`;
    return { fileName, base64: xlsx.toString('base64') };
  }
}
