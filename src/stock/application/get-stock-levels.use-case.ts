import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { StockLevel } from '../domain/stock-level';
import { StockLevelQueryCriteria } from '../domain/stock-level-query.criteria';
import { STOCK_REPOSITORY } from '../domain/stock.repository';
import type { StockRepository } from '../domain/stock.repository';
import { GetStockLevelsQuery } from './stock.queries';

@Injectable()
export class GetStockLevelsUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stock: StockRepository,
  ) {}

  async execute(query: GetStockLevelsQuery): Promise<Page<StockLevel>> {
    const criteria = StockLevelQueryCriteria.of({
      warehouseId: query.warehouseId,
      productId: query.productId,
      includeEmpty: query.includeEmpty,
      page: query.page,
      limit: query.limit,
    });

    return this.stock.findStockLevels(criteria);
  }
}
