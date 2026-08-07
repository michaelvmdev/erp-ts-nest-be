import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PurchaseSupplierNotFoundError } from '../../domain/purchase.errors';
import {
  PurchasesBySupplierReportReader,
  PurchasesBySupplierReportView,
  PurchasesBySupplierRow,
} from '../../domain/purchases-by-supplier-report-view';

/**
 * Lado de lectura del reporte de compras por proveedor: SQL directo.
 *
 * El reporte es siempre sobre un proveedor concreto: primero se resuelve su
 * nombre (y se responde 404 si no existe) y luego se listan sus compras del
 * rango, una fila por compra, ordenadas por fecha. El rango es inclusivo en
 * ambos extremos y todo viaja parametrizado.
 */
@Injectable()
export class TypeOrmPurchasesBySupplierReportReader
  implements PurchasesBySupplierReportReader
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byDateRange(
    supplierId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<PurchasesBySupplierReportView> {
    const proveedor: Array<{
      description: string;
      ruc: string;
    }> = await this.dataSource.query(
      `SELECT supplier_description AS description,
              supplier_ruc         AS ruc
         FROM suppliers
        WHERE supplier_id = $1`,
      [supplierId],
    );
    if (proveedor.length === 0) {
      throw new PurchaseSupplierNotFoundError(supplierId);
    }
    const supplierDescription = proveedor[0].description;
    const supplierRuc = proveedor[0].ruc;

    const filas: PurchasesBySupplierRow[] = await this.dataSource.query(
      `SELECT s.supplier_ruc                        AS "supplierRuc",
              s.supplier_description                AS "supplierDescription",
              to_char(p.purchase_date, 'YYYY-MM-DD') AS "purchaseDate",
              p.igv::text                           AS "igv",
              p.total::text                         AS "amount"
         FROM purchases p
         JOIN suppliers s ON s.supplier_id = p.supplier_id
        WHERE p.supplier_id = $1
          AND p.purchase_date >= $2 AND p.purchase_date <= $3
        ORDER BY p.purchase_date ASC`,
      [supplierId, dateFrom, dateTo],
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
      supplierId,
      supplierDescription,
      rows: filas,
      totals: {
        count: filas.length,
        igv: (igvCents / 100).toFixed(2),
        amount: (amountCents / 100).toFixed(2),
      },
    };
  }
}
