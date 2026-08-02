import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  DashboardRepository,
  TopClient,
  TopDepartment,
  TopProduct,
  TotalSales,
} from '../../domain/dashboard.repository';
import { MonthPeriod } from '../../domain/month-period';

/**
 * Lado de lectura del tablero: consultas agregadas sobre las ventas del mes.
 *
 * Se inyecta el `DataSource` y se escribe SQL directo en vez de reconstruir
 * agregados: un indicador es un `SUM ... GROUP BY ... LIMIT 1`, no una venta.
 * Rehidratar cientos de `Sale` para sumarlos seria caro y ajeno al proposito.
 *
 * El rango del mes viaja siempre parametrizado (`$1`, `$2`), nunca concatenado.
 * El ranking de departamento y cliente ordena por monto —`SUM(total)`— y
 * desempata por identificador para que el resultado sea estable.
 */
@Injectable()
export class TypeOrmDashboardRepository implements DashboardRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async totalSales(period: MonthPeriod): Promise<TotalSales> {
    const filas: Array<{ amount: string; count: number }> =
      await this.dataSource.query(
        `SELECT COALESCE(SUM(total), 0.00)::text AS amount,
                COUNT(*)::int                    AS count
           FROM sales
          WHERE sale_date >= $1 AND sale_date < $2`,
        [period.start, period.endExclusive],
      );

    const fila = filas[0];
    return { period: period.label, amount: fila.amount, count: fila.count };
  }

  async topProduct(period: MonthPeriod): Promise<TopProduct | null> {
    const filas: Array<{
      productId: string;
      productName: string;
      unitsSold: number;
    }> = await this.dataSource.query(
      `SELECT sd.product_id         AS "productId",
              p.product_name        AS "productName",
              SUM(sd.quantity)::int AS "unitsSold"
         FROM sale_details sd
         JOIN sales s    ON s.sale_id    = sd.sale_id
         JOIN products p ON p.product_id = sd.product_id
        WHERE s.sale_date >= $1 AND s.sale_date < $2
        GROUP BY sd.product_id, p.product_name
        ORDER BY SUM(sd.quantity) DESC, sd.product_id ASC
        LIMIT 1`,
      [period.start, period.endExclusive],
    );

    if (filas.length === 0) return null;
    const f = filas[0];
    return {
      period: period.label,
      productId: f.productId,
      productName: f.productName,
      unitsSold: f.unitsSold,
    };
  }

  async topDepartment(period: MonthPeriod): Promise<TopDepartment | null> {
    const filas: Array<{
      departmentId: string;
      departmentDescription: string;
      totalAmount: string;
    }> = await this.dataSource.query(
      `SELECT s.department_id          AS "departmentId",
              d.department_description AS "departmentDescription",
              SUM(s.total)::text       AS "totalAmount"
         FROM sales s
         JOIN departments d ON d.department_id = s.department_id
        WHERE s.sale_date >= $1 AND s.sale_date < $2
        GROUP BY s.department_id, d.department_description
        ORDER BY SUM(s.total) DESC, s.department_id ASC
        LIMIT 1`,
      [period.start, period.endExclusive],
    );

    if (filas.length === 0) return null;
    const f = filas[0];
    return {
      period: period.label,
      // department_id es char(2); se recorta por si el driver lo devuelve con
      // relleno a la derecha.
      departmentId: f.departmentId.trim(),
      departmentDescription: f.departmentDescription,
      totalAmount: f.totalAmount,
    };
  }

  async topClient(period: MonthPeriod): Promise<TopClient | null> {
    const filas: Array<{
      clientId: string;
      clientDescription: string;
      totalAmount: string;
    }> = await this.dataSource.query(
      `SELECT s.client_id          AS "clientId",
              c.client_description AS "clientDescription",
              SUM(s.total)::text   AS "totalAmount"
         FROM sales s
         JOIN clients c ON c.client_id = s.client_id
        WHERE s.sale_date >= $1 AND s.sale_date < $2
        GROUP BY s.client_id, c.client_description
        ORDER BY SUM(s.total) DESC, s.client_id ASC
        LIMIT 1`,
      [period.start, period.endExclusive],
    );

    if (filas.length === 0) return null;
    const f = filas[0];
    return {
      period: period.label,
      clientId: f.clientId,
      clientDescription: f.clientDescription,
      totalAmount: f.totalAmount,
    };
  }
}
