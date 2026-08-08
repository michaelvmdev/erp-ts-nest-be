import { Inject, Injectable } from '@nestjs/common';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER,
  SUPPLIER_PURCHASES_AMOUNT_REPORT_READER,
} from '../domain/supplier-purchases-amount-report-view';
import type {
  SupplierPurchasesAmountReportExcelRenderer,
  SupplierPurchasesAmountReportReader,
} from '../domain/supplier-purchases-amount-report-view';

export interface SupplierPurchasesAmountReportExcelOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSupplierPurchasesAmountReportExcelUseCase {
  constructor(
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_READER) private readonly reader: SupplierPurchasesAmountReportReader,
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER) private readonly renderer: SupplierPurchasesAmountReportExcelRenderer,
  ) {}

  async execute(dateFrom: string, dateTo?: string): Promise<SupplierPurchasesAmountReportExcelOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) throw new InvalidPurchasesReportRangeError(dateFrom, to);
    const view = await this.reader.byDateRange(dateFrom, to);
    const xlsx = await this.renderer.render(view);
    const fileName = view.singleDay
      ? `proveedores-monto-${view.dateFrom}.xlsx`
      : `proveedores-monto-${view.dateFrom}_${view.dateTo}.xlsx`;
    return { fileName, base64: xlsx.toString('base64') };
  }
}
