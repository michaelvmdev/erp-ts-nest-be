import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { StockMovementEntry, StockWriter } from '../../domain/stock-writer';

@Injectable()
export class TypeOrmStockWriterRepository implements StockWriter {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async insertMovements(movements: StockMovementEntry[]): Promise<void> {
    if (movements.length === 0) return;

    const values: unknown[] = [];
    const placeholders: string[] = [];

    movements.forEach((m, i) => {
      const base = i * 8;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`,
      );
      values.push(
        randomUUID(),
        m.productId,
        m.warehouseId,
        m.movementType,
        m.quantity,
        m.unitCost ?? null,
        m.referenceId ?? null,
        m.lotId ?? null,
      );
    });

    await this.ds.query(
      `INSERT INTO stock_movements
         (movement_id, product_id, warehouse_id, movement_type, quantity, unit_cost, reference_id, lot_id)
       VALUES ${placeholders.join(', ')}`,
      values,
    );
  }
}
