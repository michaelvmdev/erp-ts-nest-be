import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  PRODUCT_SALES_REPORT_EXCEL_RENDERER,
  PRODUCT_SALES_REPORT_READER,
} from '../domain/product-sales-report-view';
import type {
  ProductSalesReportExcelRenderer,
  ProductSalesReportOrderBy,
  ProductSalesReportReader,
} from '../domain/product-sales-report-view';

export interface ProductSalesReportExcelOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateProductSalesReportExcelUseCase {
  constructor(
    @Inject(PRODUCT_SALES_REPORT_READER) private readonly reader: ProductSalesReportReader,
    @Inject(PRODUCT_SALES_REPORT_EXCEL_RENDERER) private readonly renderer: ProductSalesReportExcelRenderer,
  ) {}

  async execute(
    dateFrom: string,
    dateTo?: string,
    orderBy: ProductSalesReportOrderBy = 'amount',
  ): Promise<ProductSalesReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidSalesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to, orderBy);
    const xlsx = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `productos-${view.dateFrom}.xlsx`
      : `productos-${view.dateFrom}_${view.dateTo}.xlsx`;
    return { fileName, base64: xlsx.toString('base64') };
  }
}
