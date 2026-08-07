import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SaleClientNotFoundError } from '../../domain/sale.errors';
import {
  SalesByClientReportReader,
  SalesByClientReportView,
  SalesByClientRow,
} from '../../domain/sales-by-client-report-view';

/**
 * Lado de lectura del reporte de ventas por cliente: SQL directo.
 *
 * El reporte es siempre sobre un cliente concreto: primero se resuelve su nombre
 * (y se responde 404 si no existe) y luego se listan sus ventas del rango, una
 * fila por venta, ordenadas por fecha. El rango es inclusivo en ambos extremos y
 * todo viaja parametrizado.
 */
@Injectable()
export class TypeOrmSalesByClientReportReader implements SalesByClientReportReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byDateRange(
    clientId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<SalesByClientReportView> {
    const cliente: Array<{ description: string }> = await this.dataSource.query(
      `SELECT client_description AS description
         FROM clients
        WHERE client_id = $1`,
      [clientId],
    );
    if (cliente.length === 0) {
      throw new SaleClientNotFoundError(clientId);
    }
    const clientDescription = cliente[0].description;

    const filas: SalesByClientRow[] = await this.dataSource.query(
      `SELECT dt.document_type_description       AS "documentType",
              c.document_number                  AS "documentNumber",
              c.client_description               AS "clientDescription",
              to_char(s.sale_date, 'YYYY-MM-DD')  AS "saleDate",
              s.igv::text                        AS "igv",
              s.total::text                      AS "amount"
         FROM sales s
         JOIN clients c        ON c.client_id = s.client_id
         JOIN document_types dt ON dt.document_type_id = c.document_type_id
        WHERE s.client_id = $1
          AND s.sale_date >= $2 AND s.sale_date <= $3
        ORDER BY s.sale_date ASC, s.sale_number ASC`,
      [clientId, dateFrom, dateTo],
    );

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
      clientId,
      clientDescription,
      rows: filas,
      totals: {
        count: filas.length,
        igv: (igvCents / 100).toFixed(2),
        amount: (amountCents / 100).toFixed(2),
      },
    };
  }
}
