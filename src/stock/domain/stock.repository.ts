import type { Page } from '../../shared/domain/pagination';
import type { StockLevel } from './stock-level';
import type { StockLevelQueryCriteria } from './stock-level-query.criteria';
import type { StockMovement } from './stock-movement';
import type { StockMovementQueryCriteria } from './stock-movement-query.criteria';

export interface StockAlert {
  readonly productId: string;
  readonly productName: string;
  readonly warehouseId: string;
  readonly warehouseCode: string;
  readonly currentStock: number;
  readonly minimumStock: number;
  readonly deficit: number;
}

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');

export interface StockRepository {
  findStockLevels(criteria: StockLevelQueryCriteria): Promise<Page<StockLevel>>;
  findMovements(criteria: StockMovementQueryCriteria): Promise<Page<StockMovement>>;
  findLowStock(): Promise<StockAlert[]>;
}
