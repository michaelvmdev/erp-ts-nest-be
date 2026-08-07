/**
 * Vista de lectura de un reporte de productos vendidos por rango de fechas.
 *
 * Es un read model agregado por producto: una fila por producto con las unidades
 * vendidas y los importes del periodo, ordenado por monto o por cantidad. El IGV
 * no se guarda por linea (se calcula a nivel de venta), asi que aqui se deriva
 * como 18% del subtotal acumulado del producto, y el total es subtotal + IGV.
 * Los importes viajan como cadena decimal, igual que en el resto del proyecto.
 */

export type ProductSalesReportOrderBy = 'amount' | 'quantity';

export interface ProductSalesReportRow {
  productId: string;
  productName: string;
  quantity: number;
  igv: string;
  total: string;
}

/** Totales del periodo. Cadenas decimales; "0.00" si no hubo ventas. */
export interface ProductSalesReportTotals {
  /** Cantidad de productos distintos que se vendieron. */
  productCount: number;
  /** Unidades vendidas, sumando todos los productos. */
  quantity: number;
  igv: string;
  total: string;
}

export interface ProductSalesReportView {
  /** Inicio del rango, inclusive (YYYY-MM-DD). */
  dateFrom: string;
  /** Fin del rango, inclusive (YYYY-MM-DD). */
  dateTo: string;
  /** true cuando dateFrom == dateTo: el reporte es de un solo dia. */
  singleDay: boolean;
  /** Criterio de orden aplicado: por monto (total) o por cantidad. */
  orderBy: ProductSalesReportOrderBy;
  rows: ProductSalesReportRow[];
  totals: ProductSalesReportTotals;
}

/** Puerto de lectura: arma el reporte de productos vendidos de un rango. */
export interface ProductSalesReportReader {
  byDateRange(
    dateFrom: string,
    dateTo: string,
    orderBy: ProductSalesReportOrderBy,
  ): Promise<ProductSalesReportView>;
}

export const PRODUCT_SALES_REPORT_READER = Symbol('ProductSalesReportReader');

/** Puerto de salida para convertir el reporte en un PDF. */
export interface ProductSalesReportPdfRenderer {
  render(view: ProductSalesReportView): Promise<Buffer>;
}

export const PRODUCT_SALES_REPORT_PDF_RENDERER = Symbol(
  'ProductSalesReportPdfRenderer',
);
