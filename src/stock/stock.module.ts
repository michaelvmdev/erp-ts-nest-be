import { Module } from '@nestjs/common';
import { GetStockLevelsUseCase } from './application/get-stock-levels.use-case';
import { GetStockMovementsUseCase } from './application/get-stock-movements.use-case';
import { STOCK_REPOSITORY } from './domain/stock.repository';
import { TypeOrmStockRepository } from './infrastructure/persistence/typeorm-stock.repository';
import { StockController } from './infrastructure/http/stock.controller';

@Module({
  controllers: [StockController],
  providers: [
    TypeOrmStockRepository,
    { provide: STOCK_REPOSITORY, useExisting: TypeOrmStockRepository },
    GetStockLevelsUseCase,
    GetStockMovementsUseCase,
  ],
})
export class StockModule {}
