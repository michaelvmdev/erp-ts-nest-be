/**
 * Vista de lectura del reporte "Monto de Venta de Clientes".
 *
 * Es un read model agregado por cliente: una fila por cliente que nos compra en
 * el periodo, con el IGV y el monto vendidos. Solo incluye a los clientes con al
 * menos una venta en el rango (quienes nos compran); ordenado por monto de mayor
 * a menor. Los importes viajan como cadena decimal.
 */

export interface ClientSalesAmountRow {
  clientId: string;
  clientDescription: string;
  /** Suma de IGV del cliente en el periodo. */
  igv: string;
  /** Suma de totales (monto) del cliente en el periodo. */
  amount: string;
}

export interface ClientSalesAmountTotals {
  /** Clientes que compraron en el periodo. */
  clientCount: number;
  igv: string;
  amount: string;
}

export interface ClientSalesAmountReportView {
  dateFrom: string;
  dateTo: string;
  singleDay: boolean;
  rows: ClientSalesAmountRow[];
  totals: ClientSalesAmountTotals;
}

/** Puerto de lectura: arma el reporte de monto por cliente de un rango. */
export interface ClientSalesAmountReportReader {
  byDateRange(
    dateFrom: string,
    dateTo: string,
  ): Promise<ClientSalesAmountReportView>;
}

export const CLIENT_SALES_AMOUNT_REPORT_READER = Symbol(
  'ClientSalesAmountReportReader',
);

/** Puerto de salida para convertir el reporte en un PDF. */
export interface ClientSalesAmountReportPdfRenderer {
  render(view: ClientSalesAmountReportView): Promise<Buffer>;
}

export const CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER = Symbol(
  'ClientSalesAmountReportPdfRenderer',
);

export interface ClientSalesAmountReportExcelRenderer {
  render(view: ClientSalesAmountReportView): Promise<Buffer>;
}

export const CLIENT_SALES_AMOUNT_REPORT_EXCEL_RENDERER = Symbol(
  'ClientSalesAmountReportExcelRenderer',
);
