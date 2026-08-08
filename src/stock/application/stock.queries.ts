import { StockMovementType } from '../domain/stock-movement';

export interface GetStockLevelsQuery {
  readonly warehouseId?: string | null;
  readonly productId?: string | null;
  readonly includeEmpty?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export interface GetStockMovementsQuery {
  readonly productId?: string | null;
  readonly warehouseId?: string | null;
  readonly movementType?: StockMovementType | null;
  readonly dateFrom?: string | null;
  readonly dateTo?: string | null;
  readonly page?: number;
  readonly limit?: number;
}
