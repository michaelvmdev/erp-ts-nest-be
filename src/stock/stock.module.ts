import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetStockAlertsUseCase } from './application/get-stock-alerts.use-case';
import { GetStockLevelsUseCase } from './application/get-stock-levels.use-case';
import { GetStockMovementsUseCase } from './application/get-stock-movements.use-case';
import { STOCK_REPOSITORY } from './domain/stock.repository';
import { STOCK_WRITER } from './domain/stock-writer';
import { TypeOrmStockRepository } from './infrastructure/persistence/typeorm-stock.repository';
import { TypeOrmStockWriterRepository } from './infrastructure/persistence/typeorm-stock-writer.repository';
import { StockController } from './infrastructure/http/stock.controller';
import { StockSseController } from './infrastructure/http/stock-sse.controller';

@Module({
  imports: [AuthModule],
  controllers: [StockController, StockSseController],
  providers: [
    TypeOrmStockRepository,
    { provide: STOCK_REPOSITORY, useExisting: TypeOrmStockRepository },
    TypeOrmStockWriterRepository,
    { provide: STOCK_WRITER, useExisting: TypeOrmStockWriterRepository },
    GetStockLevelsUseCase,
    GetStockMovementsUseCase,
    GetStockAlertsUseCase,
  ],
  exports: [STOCK_WRITER],
})
export class StockModule {}
