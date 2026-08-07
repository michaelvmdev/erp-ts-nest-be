import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SalesReportReader,
  SalesReportRow,
  SalesReportView,
} from '../../domain/sales-report-view';

/**
 * Lado de lectura del reporte: SQL directo sobre el DataSource.
 *
 * Dos consultas, como el lector del comprobante: una trae las filas (una por
 * venta, con el nombre del cliente y del tipo ya resueltos) y otra los totales
 * del periodo. Se separan los totales en vez de sumarlos en JS para no arrastrar
 * el redondeo de un double: PostgreSQL suma los `numeric` con precision exacta.
 *
 * El rango es inclusivo en ambos extremos; `sale_date` es una fecha sin hora, y
 * las fechas viajan parametrizadas.
 */
@Injectable()
export class TypeOrmSalesReportReader implements SalesReportReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byDateRange(
    dateFrom: string,
    dateTo: string,
  ): Promise<SalesReportView> {
    const filas: SalesReportRow[] = await this.dataSource.query(
      `SELECT s.sale_number                          AS "saleNumber",
              substring(s.sale_number from 1 for 3)  AS "saleTypeCode",
              st.sale_type_description               AS "saleTypeDescription",
              to_char(s.sale_date, 'YYYY-MM-DD')     AS "saleDate",
              to_char(s.sale_hour, 'HH24:MI:SS')     AS "saleHour",
              c.client_description                   AS "clientDescription",
              s.sub_total::text                      AS "subTotal",
              s.igv::text                            AS "igv",
              s.total::text                          AS "total"
         FROM sales s
         JOIN clients c     ON c.client_id = s.client_id
         JOIN sale_types st ON st.sale_type_code = substring(s.sale_number from 1 for 3)
        WHERE s.sale_date >= $1 AND s.sale_date <= $2
        ORDER BY s.sale_date, s.sale_number`,
      [dateFrom, dateTo],
    );

    const totales: Array<{
      count: number;
      subTotal: string;
      igv: string;
      total: string;
    }> = await this.dataSource.query(
      `SELECT COUNT(*)::int                      AS "count",
              COALESCE(SUM(s.sub_total), 0.00)::text AS "subTotal",
              COALESCE(SUM(s.igv), 0.00)::text       AS "igv",
              COALESCE(SUM(s.total), 0.00)::text     AS "total"
         FROM sales s
        WHERE s.sale_date >= $1 AND s.sale_date <= $2`,
      [dateFrom, dateTo],
    );

    const t = totales[0];

    return {
      dateFrom,
      dateTo,
      singleDay: dateFrom === dateTo,
      rows: filas.map((f) => ({
        saleNumber: f.saleNumber,
        // El codigo es char(3); se recorta por si el driver lo rellena.
        saleTypeCode: f.saleTypeCode.trim(),
        saleTypeDescription: f.saleTypeDescription,
        saleDate: f.saleDate,
        saleHour: f.saleHour,
        clientDescription: f.clientDescription,
        subTotal: f.subTotal,
        igv: f.igv,
        total: f.total,
      })),
      totals: {
        count: t.count,
        subTotal: t.subTotal,
        igv: t.igv,
        total: t.total,
      },
    };
  }
}
