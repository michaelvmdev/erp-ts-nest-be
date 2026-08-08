import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { StockMovement } from '../domain/stock-movement';
import { StockMovementQueryCriteria } from '../domain/stock-movement-query.criteria';
import { STOCK_REPOSITORY } from '../domain/stock.repository';
import type { StockRepository } from '../domain/stock.repository';
import { GetStockMovementsQuery } from './stock.queries';

@Injectable()
export class GetStockMovementsUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stock: StockRepository,
  ) {}

  async execute(query: GetStockMovementsQuery): Promise<Page<StockMovement>> {
    const criteria = StockMovementQueryCriteria.of({
      productId: query.productId,
      warehouseId: query.warehouseId,
      movementType: query.movementType,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
      dateTo: query.dateTo ? new Date(query.dateTo) : null,
      page: query.page,
      limit: query.limit,
    });

    return this.stock.findMovements(criteria);
  }
}
