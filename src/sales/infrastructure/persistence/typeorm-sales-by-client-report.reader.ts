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
 * Una fila por venta en el rango, con el documento del cliente ya resuelto. El
 * filtro opcional por cliente se agrega como parametro adicional, nunca por
 * concatenacion. Se ordena por cliente y luego por fecha para agrupar visualmente
 * las ventas de cada uno. Si se pide un cliente que no existe, se responde 404.
 */
@Injectable()
export class TypeOrmSalesByClientReportReader implements SalesByClientReportReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byDateRange(
    dateFrom: string,
    dateTo: string,
    clientId?: string,
  ): Promise<SalesByClientReportView> {
    let clientDescription: string | null = null;
    if (clientId) {
      const cliente: Array<{ description: string }> =
        await this.dataSource.query(
          `SELECT client_description AS description
             FROM clients
            WHERE client_id = $1`,
          [clientId],
        );
      if (cliente.length === 0) {
        throw new SaleClientNotFoundError(clientId);
      }
      clientDescription = cliente[0].description;
    }

    const params: unknown[] = [dateFrom, dateTo];
    let filtroCliente = '';
    if (clientId) {
      params.push(clientId);
      filtroCliente = `AND s.client_id = $${params.length}`;
    }

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
        WHERE s.sale_date >= $1 AND s.sale_date <= $2
          ${filtroCliente}
        ORDER BY c.client_description ASC, s.sale_date ASC, s.sale_number ASC`,
      params,
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
      clientId: clientId ?? null,
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
