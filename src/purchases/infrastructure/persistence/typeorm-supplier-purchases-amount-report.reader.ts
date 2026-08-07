import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SupplierPurchasesAmountReportReader,
  SupplierPurchasesAmountReportView,
  SupplierPurchasesAmountRow,
} from '../../domain/supplier-purchases-amount-report-view';

/**
 * Lado de lectura del reporte de monto por proveedor: SQL directo.
 *
 * INNER JOIN entre `suppliers` y `purchases` con el filtro de fechas: solo
 * aparecen los proveedores a los que compramos en el periodo (al menos una
 * compra), que es lo que pide el reporte. El rango es inclusivo en ambos
 * extremos y viaja parametrizado. Se ordena por monto descendente.
 */
@Injectable()
export class TypeOrmSupplierPurchasesAmountReportReader
  implements SupplierPurchasesAmountReportReader
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byDateRange(
    dateFrom: string,
    dateTo: string,
  ): Promise<SupplierPurchasesAmountReportView> {
    const filas: SupplierPurchasesAmountRow[] = await this.dataSource.query(
      `SELECT s.supplier_id          AS "supplierId",
              s.supplier_description AS "supplierDescription",
              SUM(p.igv)::text       AS "igv",
              SUM(p.total)::text     AS "amount"
         FROM suppliers s
         JOIN purchases p ON p.supplier_id = s.supplier_id
        WHERE p.purchase_date >= $1 AND p.purchase_date <= $2
        GROUP BY s.supplier_id, s.supplier_description
        ORDER BY SUM(p.total) DESC`,
      [dateFrom, dateTo],
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
      rows: filas,
      totals: {
        supplierCount: filas.length,
        igv: (igvCents / 100).toFixed(2),
        amount: (amountCents / 100).toFixed(2),
      },
    };
  }
}
