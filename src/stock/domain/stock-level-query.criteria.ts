import { PageRequest } from '../../shared/domain/pagination';

export class StockLevelQueryCriteria {
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly warehouseId: string | null,
    readonly productId: string | null,
    readonly includeEmpty: boolean,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    warehouseId?: string | null;
    productId?: string | null;
    includeEmpty?: boolean;
    page?: number;
    limit?: number;
  }): StockLevelQueryCriteria {
    return new StockLevelQueryCriteria(
      params.warehouseId?.trim() || null,
      params.productId?.trim() || null,
      params.includeEmpty ?? false,
      PageRequest.of(params.page, params.limit ?? StockLevelQueryCriteria.DEFAULT_LIMIT),
    );
  }
}
