/**
 * Vista de lectura del reporte "Ventas por Cliente".
 *
 * Es el detalle de ventas de UN cliente concreto: una fila por venta, con el
 * documento del cliente, la fecha, el IGV y el monto. Se filtra por el cliente
 * (obligatorio) y por un rango de fechas. Los importes viajan como cadena
 * decimal.
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
  /** Ventas del cliente incluidas en el reporte. */
  count: number;
  igv: string;
  amount: string;
}

export interface SalesByClientReportView {
  dateFrom: string;
  dateTo: string;
  singleDay: boolean;
  /** Cliente del que se listan las ventas. */
  clientId: string;
  /** Nombre del cliente, para el subtitulo. */
  clientDescription: string;
  rows: SalesByClientRow[];
  totals: SalesByClientTotals;
}

/**
 * Puerto de lectura: arma el detalle de ventas de un cliente en un rango.
 * `clientId` es obligatorio: el reporte es siempre sobre un cliente concreto.
 */
export interface SalesByClientReportReader {
  byDateRange(
    clientId: string,
    dateFrom: string,
    dateTo: string,
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
