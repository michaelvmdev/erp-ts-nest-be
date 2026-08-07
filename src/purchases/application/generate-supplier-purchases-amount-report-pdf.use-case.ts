import { Inject, Injectable } from '@nestjs/common';
import { InvalidPurchasesReportRangeError } from '../domain/purchase.errors';
import {
  SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER,
  SUPPLIER_PURCHASES_AMOUNT_REPORT_READER,
} from '../domain/supplier-purchases-amount-report-view';
import type {
  SupplierPurchasesAmountReportPdfRenderer,
  SupplierPurchasesAmountReportReader,
} from '../domain/supplier-purchases-amount-report-view';

export interface SupplierPurchasesAmountReportPdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSupplierPurchasesAmountReportPdfUseCase {
  constructor(
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_READER)
    private readonly reader: SupplierPurchasesAmountReportReader,
    @Inject(SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER)
    private readonly renderer: SupplierPurchasesAmountReportPdfRenderer,
  ) {}

  async execute(
    dateFrom: string,
    dateTo?: string,
  ): Promise<SupplierPurchasesAmountReportPdfOutput> {
    const to = dateTo ?? dateFrom;
    if (to < dateFrom) {
      throw new InvalidPurchasesReportRangeError(dateFrom, to);
    }

    const view = await this.reader.byDateRange(dateFrom, to);
    const pdf = await this.renderer.render(view);

    const fileName = view.singleDay
      ? `monto-proveedores-${view.dateFrom}.pdf`
      : `monto-proveedores-${view.dateFrom}_${view.dateTo}.pdf`;

    return { fileName, base64: pdf.toString('base64') };
  }
}
