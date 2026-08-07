/**
 * Vista de lectura del reporte "Compras por Proveedor".
 *
 * Es el detalle de compras de UN proveedor concreto: una fila por compra, con
 * el RUC del proveedor, la fecha, el IGV y el monto. Se filtra por el proveedor
 * (obligatorio) y por un rango de fechas. Los importes viajan como cadena decimal.
 */

export interface PurchasesBySupplierRow {
  supplierRuc: string;
  supplierDescription: string;
  /** Fecha de la compra, YYYY-MM-DD. */
  purchaseDate: string;
  igv: string;
  /** Monto de la compra (total). */
  amount: string;
}

export interface PurchasesBySupplierTotals {
  /** Compras del proveedor incluidas en el reporte. */
  count: number;
  igv: string;
  amount: string;
}

export interface PurchasesBySupplierReportView {
  dateFrom: string;
  dateTo: string;
  singleDay: boolean;
  /** Proveedor del que se listan las compras. */
  supplierId: string;
  /** Nombre del proveedor, para el subtitulo. */
  supplierDescription: string;
  rows: PurchasesBySupplierRow[];
  totals: PurchasesBySupplierTotals;
}

/**
 * Puerto de lectura: arma el detalle de compras de un proveedor en un rango.
 * `supplierId` es obligatorio: el reporte es siempre sobre un proveedor concreto.
 */
export interface PurchasesBySupplierReportReader {
  byDateRange(
    supplierId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<PurchasesBySupplierReportView>;
}

export const PURCHASES_BY_SUPPLIER_REPORT_READER = Symbol(
  'PurchasesBySupplierReportReader',
);

export interface PurchasesBySupplierReportPdfRenderer {
  render(view: PurchasesBySupplierReportView): Promise<Buffer>;
}

export const PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER = Symbol(
  'PurchasesBySupplierReportPdfRenderer',
);
