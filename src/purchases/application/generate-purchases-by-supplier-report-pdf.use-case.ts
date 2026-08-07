import { Inject, Injectable } from '@nestjs/common';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER,
  PURCHASES_BY_SUPPLIER_REPORT_READER,
} from '../domain/purchases-by-supplier-report-view';
import type {
  PurchasesBySupplierReportPdfRenderer,
  PurchasesBySupplierReportReader,
} from '../domain/purchases-by-supplier-report-view';

export interface PurchasesBySupplierReportPdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GeneratePurchasesBySupplierReportPdfUseCase {
  constructor(
    @Inject(PURCHASES_BY_SUPPLIER_REPORT_READER)
    private readonly reader: PurchasesBySupplierReportReader,
    @Inject(PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER)
    private readonly renderer: PurchasesBySupplierReportPdfRenderer,
  ) {}

  async execute(
    supplierId: string,
    dateFrom: string,
    dateTo?: string,
  ): Promise<PurchasesBySupplierReportPdfOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidPurchasesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(supplierId, dateFrom, to);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `compras-proveedor-${view.dateFrom}.pdf`
      : `compras-proveedor-${view.dateFrom}_${view.dateTo}.pdf`;

    return { fileName, base64: pdf.toString('base64') };
  }
}
