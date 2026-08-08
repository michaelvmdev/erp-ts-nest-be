/**
 * Vista de lectura del reporte "Monto de Compras por Proveedor".
 *
 * Una fila por proveedor al que compramos en el periodo (INNER JOIN), ordenados
 * por monto descendente. Los importes viajan como cadena decimal.
 */

export interface SupplierPurchasesAmountRow {
  supplierId: string;
  supplierDescription: string;
  igv: string;
  amount: string;
}

export interface SupplierPurchasesAmountTotals {
  supplierCount: number;
  igv: string;
  amount: string;
}

export interface SupplierPurchasesAmountReportView {
  dateFrom: string;
  dateTo: string;
  singleDay: boolean;
  rows: SupplierPurchasesAmountRow[];
  totals: SupplierPurchasesAmountTotals;
}

export interface SupplierPurchasesAmountReportReader {
  byDateRange(
    dateFrom: string,
    dateTo: string,
  ): Promise<SupplierPurchasesAmountReportView>;
}

export const SUPPLIER_PURCHASES_AMOUNT_REPORT_READER = Symbol(
  'SupplierPurchasesAmountReportReader',
);

export interface SupplierPurchasesAmountReportPdfRenderer {
  render(view: SupplierPurchasesAmountReportView): Promise<Buffer>;
}

export const SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER = Symbol(
  'SupplierPurchasesAmountReportPdfRenderer',
);

export interface SupplierPurchasesAmountReportExcelRenderer {
  render(view: SupplierPurchasesAmountReportView): Promise<Buffer>;
}

export const SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER = Symbol(
  'SupplierPurchasesAmountReportExcelRenderer',
);
