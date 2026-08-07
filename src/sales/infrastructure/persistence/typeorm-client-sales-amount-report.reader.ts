import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ClientSalesAmountReportReader,
  ClientSalesAmountReportView,
  ClientSalesAmountRow,
} from '../../domain/client-sales-amount-report-view';

/**
 * Lado de lectura del reporte de monto por cliente: SQL directo.
 *
 * INNER JOIN entre `clients` y `sales` con el filtro de fechas: solo aparecen los
 * clientes que nos compran en el periodo (al menos una venta), que es lo que pide
 * el reporte. El rango es inclusivo en ambos extremos y viaja parametrizado. Se
 * ordena por monto descendente: los que mas compran quedan arriba.
 */
@Injectable()
export class TypeOrmClientSalesAmountReportReader implements ClientSalesAmountReportReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byDateRange(
    dateFrom: string,
    dateTo: string,
  ): Promise<ClientSalesAmountReportView> {
    const filas: ClientSalesAmountRow[] = await this.dataSource.query(
      `SELECT c.client_id          AS "clientId",
              c.client_description AS "clientDescription",
              SUM(s.igv)::text     AS "igv",
              SUM(s.total)::text   AS "amount"
         FROM clients c
         JOIN sales s ON s.client_id = c.client_id
        WHERE s.sale_date >= $1 AND s.sale_date <= $2
        GROUP BY c.client_id, c.client_description
        ORDER BY SUM(s.total) DESC, c.client_description ASC`,
      [dateFrom, dateTo],
    );

    // Totales en centavos (enteros) a partir de las filas, para que el pie
    // coincida exactamente con la suma de las columnas.
    let igvCents = 0;
    let amountCents = 0;
    for (const f of filas) {
      igvCents += Math.round(Number(f.igv) * 100);
      amountCents += Math.round(Number(f.amount) * 100);
    }

    return {
      dateFrom,
      dateTo,
      singleDay: dateFrom === dateTo,
      rows: filas,
      totals: {
        clientCount: filas.length,
        igv: (igvCents / 100).toFixed(2),
        amount: (amountCents / 100).toFixed(2),
      },
    };
  }
}
