import { Inject, Injectable } from '@nestjs/common';
import { STOCK_REPOSITORY } from '../domain/stock.repository';
import type { StockAlert, StockRepository } from '../domain/stock.repository';

@Injectable()
export class GetStockAlertsUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stock: StockRepository,
  ) {}

  execute(): Promise<StockAlert[]> {
    return this.stock.findLowStock();
  }
}
