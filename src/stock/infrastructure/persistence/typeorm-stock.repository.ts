import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { StockLevel } from '../../domain/stock-level';
import { StockLevelQueryCriteria } from '../../domain/stock-level-query.criteria';
import { StockMovement } from '../../domain/stock-movement';
import { StockMovementQueryCriteria } from '../../domain/stock-movement-query.criteria';
import { StockRepository } from '../../domain/stock.repository';

@Injectable()
export class TypeOrmStockRepository implements StockRepository {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async findStockLevels(criteria: StockLevelQueryCriteria): Promise<Page<StockLevel>> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (criteria.warehouseId) {
      params.push(criteria.warehouseId);
      conditions.push(`sm.warehouse_id = $${params.length}`);
    }

    if (criteria.productId) {
      params.push(criteria.productId);
      conditions.push(`sm.product_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const having = criteria.includeEmpty ? '' : 'HAVING SUM(sm.quantity) > 0';

    const baseSql = `
      FROM stock_movements sm
      JOIN products p        ON p.product_id   = sm.product_id
      JOIN warehouses w      ON w.warehouse_id  = sm.warehouse_id
      ${where}
      GROUP BY sm.product_id, p.product_code, p.product_name,
               sm.warehouse_id, w.warehouse_code, w.warehouse_description
      ${having}
    `;

    const countSql = `SELECT COUNT(*) AS total FROM (SELECT 1 ${baseSql}) sub`;
    const [{ total }] = await this.ds.query(countSql, params);

    params.push(criteria.page.limit);
    params.push(criteria.page.offset);

    const dataSql = `
      SELECT
        sm.product_id        AS "productId",
        p.product_code       AS "productCode",
        p.product_name       AS "productName",
        sm.warehouse_id      AS "warehouseId",
        w.warehouse_code     AS "warehouseCode",
        w.warehouse_description AS "warehouseDescription",
        SUM(sm.quantity)::numeric AS "quantity"
      ${baseSql}
      ORDER BY p.product_name ASC, w.warehouse_code ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const rows: Record<string, unknown>[] = await this.ds.query(dataSql, params);

    const items: StockLevel[] = rows.map((r) => ({
      productId: r['productId'] as string,
      productCode: r['productCode'] as string,
      productName: r['productName'] as string,
      warehouseId: r['warehouseId'] as string,
      warehouseCode: r['warehouseCode'] as string,
      warehouseDescription: r['warehouseDescription'] as string,
      quantity: Number(r['quantity']),
    }));

    return new Page(items, Number(total), criteria.page.page, criteria.page.limit);
  }

  async findMovements(criteria: StockMovementQueryCriteria): Promise<Page<StockMovement>> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (criteria.productId) {
      params.push(criteria.productId);
      conditions.push(`sm.product_id = $${params.length}`);
    }

    if (criteria.warehouseId) {
      params.push(criteria.warehouseId);
      conditions.push(`sm.warehouse_id = $${params.length}`);
    }

    if (criteria.movementType) {
      params.push(criteria.movementType);
      conditions.push(`sm.movement_type = $${params.length}`);
    }

    if (criteria.dateFrom) {
      params.push(criteria.dateFrom.toISOString());
      conditions.push(`sm.created_at >= $${params.length}`);
    }

    if (criteria.dateTo) {
      params.push(criteria.dateTo.toISOString());
      conditions.push(`sm.created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM stock_movements sm
      ${where}
    `;
    const [{ total }] = await this.ds.query(countSql, params);

    params.push(criteria.page.limit);
    params.push(criteria.page.offset);

    const dataSql = `
      SELECT
        sm.movement_id    AS "movementId",
        sm.product_id     AS "productId",
        p.product_code    AS "productCode",
        p.product_name    AS "productName",
        sm.warehouse_id   AS "warehouseId",
        w.warehouse_code  AS "warehouseCode",
        sm.movement_type  AS "movementType",
        sm.quantity::numeric AS "quantity",
        sm.unit_cost::numeric AS "unitCost",
        sm.notes          AS "notes",
        sm.reference_id   AS "referenceId",
        sm.created_at     AS "createdAt"
      FROM stock_movements sm
      JOIN products p    ON p.product_id  = sm.product_id
      JOIN warehouses w  ON w.warehouse_id = sm.warehouse_id
      ${where}
      ORDER BY sm.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const rows: Record<string, unknown>[] = await this.ds.query(dataSql, params);

    const items: StockMovement[] = rows.map((r) => ({
      movementId: r['movementId'] as string,
      productId: r['productId'] as string,
      productCode: r['productCode'] as string,
      productName: r['productName'] as string,
      warehouseId: r['warehouseId'] as string,
      warehouseCode: r['warehouseCode'] as string,
      movementType: r['movementType'] as StockMovement['movementType'],
      quantity: Number(r['quantity']),
      unitCost: r['unitCost'] != null ? Number(r['unitCost']) : null,
      notes: (r['notes'] as string | null) ?? null,
      referenceId: (r['referenceId'] as string | null) ?? null,
      createdAt: new Date(r['createdAt'] as string),
    }));

    return new Page(items, Number(total), criteria.page.page, criteria.page.limit);
  }
}
