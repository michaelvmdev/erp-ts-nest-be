import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ProductSalesReportOrderBy,
  ProductSalesReportReader,
  ProductSalesReportRow,
  ProductSalesReportView,
} from '../../domain/product-sales-report-view';

/**
 * Lado de lectura del reporte de productos: SQL directo sobre el DataSource.
 *
 * Agrega `sale_details` por producto en el rango. El IGV no existe por linea (se
 * calcula a nivel de venta), asi que se deriva como 18% del subtotal acumulado
 * del producto —`ROUND(SUM(partial) * 0.18, 2)`— y el total es subtotal + IGV.
 *
 * El `ORDER BY` se arma desde una lista blanca segun `orderBy`, nunca por
 * concatenacion del valor recibido. El rango es inclusivo en ambos extremos y
 * viaja parametrizado.
 */
@Injectable()
export class TypeOrmProductSalesReportReader implements ProductSalesReportReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private static readonly ORDEN: Record<ProductSalesReportOrderBy, string> = {
    amount: 'SUM(sd.partial) DESC, p.product_name ASC',
    quantity: 'SUM(sd.quantity) DESC, p.product_name ASC',
  };

  async byDateRange(
    dateFrom: string,
    dateTo: string,
    orderBy: ProductSalesReportOrderBy,
  ): Promise<ProductSalesReportView> {
    const orden = TypeOrmProductSalesReportReader.ORDEN[orderBy];

    const filas: ProductSalesReportRow[] = await this.dataSource.query(
      `SELECT p.product_id                          AS "productId",
              p.product_name                        AS "productName",
              SUM(sd.quantity)::int                 AS "quantity",
              ROUND(SUM(sd.partial) * 0.18, 2)::text AS "igv",
              (SUM(sd.partial) + ROUND(SUM(sd.partial) * 0.18, 2))::text AS "total"
         FROM sale_details sd
         JOIN sales s    ON s.sale_id    = sd.sale_id
         JOIN products p ON p.product_id = sd.product_id
        WHERE s.sale_date >= $1 AND s.sale_date <= $2
        GROUP BY p.product_id, p.product_name
        ORDER BY ${orden}`,
      [dateFrom, dateTo],
    );

    // Los totales se suman en centavos (enteros) a partir de las filas ya
    // redondeadas, para que el pie coincida exactamente con la suma de la
    // columna y no arrastre el redondeo de un double.
    let quantity = 0;
    let igvCents = 0;
    let totalCents = 0;
    for (const f of filas) {
      quantity += f.quantity;
      igvCents += Math.round(Number(f.igv) * 100);
      totalCents += Math.round(Number(f.total) * 100);
    }

    return {
      dateFrom,
      dateTo,
      singleDay: dateFrom === dateTo,
      orderBy,
      rows: filas,
      totals: {
        productCount: filas.length,
        quantity,
        igv: (igvCents / 100).toFixed(2),
        total: (totalCents / 100).toFixed(2),
      },
    };
  }
}
