import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { STOCK_REPOSITORY } from '../domain/stock.repository';
import type { StockRepository, StockAlert } from '../domain/stock.repository';

export interface GeneratePosResult {
  created: Array<{ purchaseOrderId: string; supplierId: string; items: number }>;
  skipped: Array<{ productId: string; productName: string; reason: string }>;
}

@Injectable()
export class GeneratePosUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepo: StockRepository,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async execute(): Promise<GeneratePosResult> {
    const alerts = await this.stockRepo.findLowStock();
    if (alerts.length === 0) return { created: [], skipped: [] };

    const productIds = [...new Set(alerts.map((a) => a.productId))];

    const lastSupplierRows: Array<{ productId: string; supplierId: string; unitPrice: string }> =
      await this.ds.query(
        `SELECT DISTINCT ON (pd.product_id)
           pd.product_id    AS "productId",
           p.supplier_id    AS "supplierId",
           pd.unit_price::text AS "unitPrice"
         FROM purchase_details pd
         JOIN purchases p ON p.purchase_id = pd.purchase_id
         WHERE pd.product_id = ANY($1)
         ORDER BY pd.product_id, p.purchase_date DESC`,
        [productIds],
      );

    const supplierMap = new Map(lastSupplierRows.map((r) => [r.productId, r]));

    const bySupplier = new Map<string, Array<{ alert: StockAlert; unitPrice: number }>>();
    const skipped: GeneratePosResult['skipped'] = [];

    for (const alert of alerts) {
      const sup = supplierMap.get(alert.productId);
      if (!sup) {
        skipped.push({ productId: alert.productId, productName: alert.productName, reason: 'Sin historial de compras' });
        continue;
      }
      const bucket = bySupplier.get(sup.supplierId) ?? [];
      bucket.push({ alert, unitPrice: parseFloat(sup.unitPrice) });
      bySupplier.set(sup.supplierId, bucket);
    }

    const created: GeneratePosResult['created'] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const [supplierId, items] of bySupplier) {
      const purchaseOrderId = randomUUID();
      let subTotal = 0;
      await this.ds.query(
        `INSERT INTO purchase_orders
           (purchase_order_id, supplier_id, purchase_order_date, purchase_order_status,
            sub_total, igv, total, notes)
         VALUES ($1,$2,$3,'pending',0,0,0,'Auto-generada por alertas de stock')`,
        [purchaseOrderId, supplierId, today],
      );

      let itemN = 1;
      for (const { alert, unitPrice } of items) {
        const qty = Math.ceil(alert.deficit);
        const partial = qty * unitPrice;
        subTotal += partial;
        await this.ds.query(
          `INSERT INTO purchase_order_details
             (purchase_order_id, item, product_id, quantity_ordered, quantity_received, unit_price, partial)
           VALUES ($1,$2,$3,$4,0,$5,$6)`,
          [purchaseOrderId, itemN++, alert.productId, qty, unitPrice, partial],
        );
      }

      const igv     = subTotal * 0.18;
      const total   = subTotal + igv;
      await this.ds.query(
        `UPDATE purchase_orders SET sub_total=$1, igv=$2, total=$3 WHERE purchase_order_id=$4`,
        [subTotal, igv, total, purchaseOrderId],
      );

      created.push({ purchaseOrderId, supplierId, items: items.length });
    }

    return { created, skipped };
  }
}
