import { Inject, Injectable } from '@nestjs/common';
import { InvalidSalesReportRangeError } from '../domain/sale.errors';
import {
  SALES_REPORT_PDF_RENDERER,
  SALES_REPORT_READER,
} from '../domain/sales-report-view';
import type {
  SalesReportPdfRenderer,
  SalesReportReader,
} from '../domain/sales-report-view';

export interface SalesReportPdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSalesReportPdfUseCase {
  constructor(
    @Inject(SALES_REPORT_READER)
    private readonly reader: SalesReportReader,
    @Inject(SALES_REPORT_PDF_RENDERER)
    private readonly renderer: SalesReportPdfRenderer,
  ) {}

  /**
   * `dateTo` es opcional: si se omite, el reporte es del dia `dateFrom`. Las
   * fechas llegan validadas en formato YYYY-MM-DD desde el DTO, asi que aqui la
   * comparacion lexicografica de cadenas equivale a comparar fechas.
   */
  async execute(
    dateFrom: string,
    dateTo?: string,
  ): Promise<SalesReportPdfOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidSalesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `ventas-${view.dateFrom}.pdf`
      : `ventas-${view.dateFrom}_${view.dateTo}.pdf`;

    return { fileName, base64: pdf.toString('base64') };
  }
}
