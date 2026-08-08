/**
 * Vista de lectura de un reporte de ventas por rango de fechas.
 *
 * No es el agregado Sale ni la vista imprimible de un comprobante: es un read
 * model plano y agregado, pensado para listar muchas ventas en una tabla. Cada
 * fila resume una venta (una fila por venta, sin el detalle de productos) y al
 * final viajan los totales del periodo. Los importes van como cadena decimal,
 * igual que en el resto del proyecto.
 */

export interface SalesReportRow {
  saleNumber: string;
  saleTypeCode: string;
  saleTypeDescription: string;
  /** Fecha de emision, YYYY-MM-DD. */
  saleDate: string;
  /** Hora de emision, HH:MM:SS. */
  saleHour: string;
  clientDescription: string;
  subTotal: string;
  igv: string;
  total: string;
}

/** Totales del periodo. Cadenas decimales; "0.00" si no hubo ventas. */
export interface SalesReportTotals {
  count: number;
  subTotal: string;
  igv: string;
  total: string;
}

export interface SalesReportView {
  /** Inicio del rango, inclusive (YYYY-MM-DD). */
  dateFrom: string;
  /** Fin del rango, inclusive (YYYY-MM-DD). */
  dateTo: string;
  /** true cuando dateFrom == dateTo: el reporte es de un solo dia. */
  singleDay: boolean;
  rows: SalesReportRow[];
  totals: SalesReportTotals;
}

/** Puerto de lectura: arma el reporte de las ventas de un rango de fechas. */
export interface SalesReportReader {
  byDateRange(dateFrom: string, dateTo: string): Promise<SalesReportView>;
}

export const SALES_REPORT_READER = Symbol('SalesReportReader');

/**
 * Puerto de salida para convertir el reporte en un PDF. La aplicacion depende de
 * esta interfaz y no de pdfkit; el adaptador concreto vive en infraestructura.
 */
export interface SalesReportPdfRenderer {
  render(view: SalesReportView): Promise<Buffer>;
}

export const SALES_REPORT_PDF_RENDERER = Symbol('SalesReportPdfRenderer');

export interface SalesReportExcelRenderer {
  render(view: SalesReportView): Promise<Buffer>;
}

export const SALES_REPORT_EXCEL_RENDERER = Symbol('SalesReportExcelRenderer');
