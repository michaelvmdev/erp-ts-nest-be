import { PageRequest } from '../../shared/domain/pagination';
import { StockMovementType } from './stock-movement';

export class StockMovementQueryCriteria {
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly productId: string | null,
    readonly warehouseId: string | null,
    readonly movementType: StockMovementType | null,
    readonly dateFrom: Date | null,
    readonly dateTo: Date | null,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    productId?: string | null;
    warehouseId?: string | null;
    movementType?: StockMovementType | null;
    dateFrom?: Date | null;
    dateTo?: Date | null;
    page?: number;
    limit?: number;
  }): StockMovementQueryCriteria {
    return new StockMovementQueryCriteria(
      params.productId?.trim() || null,
      params.warehouseId?.trim() || null,
      params.movementType ?? null,
      params.dateFrom ?? null,
      params.dateTo ?? null,
      PageRequest.of(params.page, params.limit ?? StockMovementQueryCriteria.DEFAULT_LIMIT),
    );
  }
}
