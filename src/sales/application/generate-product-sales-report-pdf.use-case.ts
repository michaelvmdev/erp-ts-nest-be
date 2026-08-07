import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  PRODUCT_SALES_REPORT_PDF_RENDERER,
  PRODUCT_SALES_REPORT_READER,
  ProductSalesReportOrderBy,
} from '../domain/product-sales-report-view';
import type {
  ProductSalesReportPdfRenderer,
  ProductSalesReportReader,
} from '../domain/product-sales-report-view';

export interface ProductSalesReportPdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateProductSalesReportPdfUseCase {
  constructor(
    @Inject(PRODUCT_SALES_REPORT_READER)
    private readonly reader: ProductSalesReportReader,
    @Inject(PRODUCT_SALES_REPORT_PDF_RENDERER)
    private readonly renderer: ProductSalesReportPdfRenderer,
  ) {}

  /**
   * `dateTo` es opcional: si se omite, el reporte es del dia `dateFrom`. Las
   * fechas llegan validadas como YYYY-MM-DD desde el DTO, asi que la comparacion
   * de cadenas equivale a comparar fechas. `orderBy` por defecto es por monto.
   */
  async execute(
    dateFrom: string,
    dateTo?: string,
    orderBy: ProductSalesReportOrderBy = 'amount',
  ): Promise<ProductSalesReportPdfOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to, orderBy);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `productos-vendidos-${view.dateFrom}.pdf`
      : `productos-vendidos-${view.dateFrom}_${view.dateTo}.pdf`;

    return { fileName, base64: pdf.toString('base64') };
  }
}
