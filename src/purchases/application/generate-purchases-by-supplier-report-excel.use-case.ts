import { Inject, Injectable } from '@nestjs/common';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  PURCHASES_BY_SUPPLIER_REPORT_EXCEL_RENDERER,
  PURCHASES_BY_SUPPLIER_REPORT_READER,
} from '../domain/purchases-by-supplier-report-view';
import type {
  PurchasesBySupplierReportExcelRenderer,
  PurchasesBySupplierReportReader,
} from '../domain/purchases-by-supplier-report-view';

export interface PurchasesBySupplierReportExcelOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GeneratePurchasesBySupplierReportExcelUseCase {
  constructor(
    @Inject(PURCHASES_BY_SUPPLIER_REPORT_READER) private readonly reader: PurchasesBySupplierReportReader,
    @Inject(PURCHASES_BY_SUPPLIER_REPORT_EXCEL_RENDERER) private readonly renderer: PurchasesBySupplierReportExcelRenderer,
  ) {}

  async execute(supplierId: string, dateFrom: string, dateTo?: string): Promise<PurchasesBySupplierReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidPurchasesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(supplierId, dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const slug = view.singleDay ? view.dateFrom : `${view.dateFrom}_${view.dateTo}`;
    const fileName = `compras-proveedor-${slug}.xlsx`;
    return { fileName, base64: xlsx.toString('base64') };
  }
}
