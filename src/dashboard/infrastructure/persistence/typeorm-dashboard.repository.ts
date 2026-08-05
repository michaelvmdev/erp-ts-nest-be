import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  DashboardRepository,
  MonthlyAmount,
  MonthlyTopProduct,
  TopClient,
  TopDepartment,
  TopProduct,
  TotalSales,
  UbigeoFilter,
  YearlyAmount,
} from '../../domain/dashboard.repository';
import { MonthPeriod } from '../../domain/month-period';
import { YearPeriod } from '../../domain/year-period';

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

  // --- Diagramas anuales ---
  //
  // Todos parten de generate_series(1,12) y hacen LEFT JOIN contra las ventas:
  // asi los meses sin ventas aparecen igual, con total en cero, y la serie que
  // recibe el front siempre trae los doce meses.

  async monthlySales(period: YearPeriod): Promise<MonthlyAmount[]> {
    const filas: Array<{ month: number; total: string }> =
      await this.dataSource.query(
        `SELECT m.month                          AS "month",
                COALESCE(SUM(s.total), 0.00)::text AS "total"
           FROM generate_series(1, 12) AS m(month)
           LEFT JOIN sales s
             ON EXTRACT(MONTH FROM s.sale_date)::int = m.month
            AND s.sale_date >= $1 AND s.sale_date < $2
          GROUP BY m.month
          ORDER BY m.month`,
        [period.start, period.endExclusive],
      );

    return filas.map((f) => ({ month: f.month, total: f.total }));
  }

  async monthlySalesByUbigeo(
    period: YearPeriod,
    ubigeo: UbigeoFilter,
  ): Promise<MonthlyAmount[]> {
    // El filtro de localidad va en el ON del LEFT JOIN, no en un WHERE: en el
    // WHERE descartaria los meses sin ventas y romperia la serie de doce.
    const condiciones = ['s.department_id = $3'];
    const params: unknown[] = [
      period.start,
      period.endExclusive,
      ubigeo.departmentId,
    ];
    if (ubigeo.provinceId) {
      params.push(ubigeo.provinceId);
      condiciones.push(`s.province_id = $${params.length}`);
    }
    if (ubigeo.districtId) {
      params.push(ubigeo.districtId);
      condiciones.push(`s.district_id = $${params.length}`);
    }

    const filas: Array<{ month: number; total: string }> =
      await this.dataSource.query(
        `SELECT m.month                           AS "month",
                COALESCE(SUM(s.total), 0.00)::text AS "total"
           FROM generate_series(1, 12) AS m(month)
           LEFT JOIN sales s
             ON EXTRACT(MONTH FROM s.sale_date)::int = m.month
            AND s.sale_date >= $1 AND s.sale_date < $2
            AND ${condiciones.join(' AND ')}
          GROUP BY m.month
          ORDER BY m.month`,
        params,
      );

    return filas.map((f) => ({ month: f.month, total: f.total }));
  }

  async monthlySalesByCategory(
    period: YearPeriod,
    categoryId: string,
  ): Promise<MonthlyAmount[]> {
    // El total por categoria se suma sobre sale_details.partial (importe de
    // linea), no sobre sales.total, porque una venta puede mezclar categorias.
    // La subconsulta ya filtra por categoria; el LEFT JOIN solo rellena meses.
    const filas: Array<{ month: number; total: string }> =
      await this.dataSource.query(
        `SELECT m.month                          AS "month",
                COALESCE(SUM(x.partial), 0.00)::text AS "total"
           FROM generate_series(1, 12) AS m(month)
           LEFT JOIN (
             SELECT EXTRACT(MONTH FROM s.sale_date)::int AS month,
                    sd.partial                           AS partial
               FROM sale_details sd
               JOIN sales s    ON s.sale_id    = sd.sale_id
               JOIN products p ON p.product_id = sd.product_id
              WHERE s.sale_date >= $1 AND s.sale_date < $2
                AND p.category_id = $3
           ) x ON x.month = m.month
          GROUP BY m.month
          ORDER BY m.month`,
        [period.start, period.endExclusive, categoryId],
      );

    return filas.map((f) => ({ month: f.month, total: f.total }));
  }

  async topProductByMonth(period: YearPeriod): Promise<MonthlyTopProduct[]> {
    // Por cada mes, un LEFT JOIN LATERAL trae el producto con mas unidades
    // vendidas (desempate por id para que sea estable). Los meses sin ventas
    // quedan con producto en NULL.
    const filas: Array<{
      month: number;
      productId: string | null;
      productName: string | null;
      productDescription: string | null;
      unitsSold: number | null;
    }> = await this.dataSource.query(
      `SELECT m.month                    AS "month",
              tp.product_id              AS "productId",
              p.product_name             AS "productName",
              p.product_description      AS "productDescription",
              tp.units_sold              AS "unitsSold"
         FROM generate_series(1, 12) AS m(month)
         LEFT JOIN LATERAL (
           SELECT sd.product_id,
                  SUM(sd.quantity)::int AS units_sold
             FROM sale_details sd
             JOIN sales s ON s.sale_id = sd.sale_id
            WHERE s.sale_date >= $1 AND s.sale_date < $2
              AND EXTRACT(MONTH FROM s.sale_date)::int = m.month
            GROUP BY sd.product_id
            ORDER BY SUM(sd.quantity) DESC, sd.product_id ASC
            LIMIT 1
         ) tp ON true
         LEFT JOIN products p ON p.product_id = tp.product_id
        ORDER BY m.month`,
      [period.start, period.endExclusive],
    );

    return filas.map((f) => ({
      month: f.month,
      productId: f.productId,
      productName: f.productName,
      productDescription: f.productDescription,
      unitsSold: f.unitsSold ?? 0,
    }));
  }

  async yearlySales(): Promise<YearlyAmount[]> {
    const filas: Array<{ year: number; total: string }> =
      await this.dataSource.query(
        `WITH bounds AS (
           SELECT COALESCE(MIN(EXTRACT(YEAR FROM sale_date)::int), EXTRACT(YEAR FROM CURRENT_DATE)::int) AS min_year,
                  GREATEST(
                    COALESCE(MAX(EXTRACT(YEAR FROM sale_date)::int), EXTRACT(YEAR FROM CURRENT_DATE)::int),
                    EXTRACT(YEAR FROM CURRENT_DATE)::int
                  ) AS max_year
             FROM sales
         )
         SELECT y.year                         AS "year",
                COALESCE(SUM(s.total), 0.00)::text AS "total"
           FROM bounds b
          CROSS JOIN generate_series(b.min_year, b.max_year) AS y(year)
           LEFT JOIN sales s
             ON EXTRACT(YEAR FROM s.sale_date)::int = y.year
          GROUP BY y.year
          ORDER BY y.year`,
      );

    return filas.map((f) => ({ year: f.year, total: f.total }));
  }
}
