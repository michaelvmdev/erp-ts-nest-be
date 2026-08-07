/**
 * Vista de lectura del reporte "Ventas por Cliente".
 *
 * Es un detalle: una fila por venta, con el documento del cliente, la fecha, el
 * IGV y el monto. Muestra quienes nos compran y cuanto. Se puede filtrar por
 * rango de fechas y, opcionalmente, por un cliente. Los importes viajan como
 * cadena decimal.
 */

export interface SalesByClientRow {
  /** Tipo de documento del cliente: "DNI" o "RUC". */
  documentType: string;
  documentNumber: string;
  clientDescription: string;
  /** Fecha de emision, YYYY-MM-DD. */
  saleDate: string;
  igv: string;
  /** Monto de la venta (total). */
  amount: string;
}

export interface SalesByClientTotals {
  /** Ventas incluidas en el reporte. */
  count: number;
  igv: string;
  amount: string;
}

export interface SalesByClientReportView {
  dateFrom: string;
  dateTo: string;
  singleDay: boolean;
  /** Cliente por el que se filtro, o null si se incluyen todos. */
  clientId: string | null;
  /** Nombre del cliente filtrado, para el subtitulo; null si no se filtro. */
  clientDescription: string | null;
  rows: SalesByClientRow[];
  totals: SalesByClientTotals;
}

/** Puerto de lectura: arma el detalle de ventas por cliente de un rango. */
export interface SalesByClientReportReader {
  byDateRange(
    dateFrom: string,
    dateTo: string,
    clientId?: string,
  ): Promise<SalesByClientReportView>;
}

export const SALES_BY_CLIENT_REPORT_READER = Symbol(
  'SalesByClientReportReader',
);

/** Puerto de salida para convertir el reporte en un PDF. */
export interface SalesByClientReportPdfRenderer {
  render(view: SalesByClientReportView): Promise<Buffer>;
}

export const SALES_BY_CLIENT_REPORT_PDF_RENDERER = Symbol(
  'SalesByClientReportPdfRenderer',
);
