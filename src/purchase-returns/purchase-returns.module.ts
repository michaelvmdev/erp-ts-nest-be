import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { StockModule } from '../stock/stock.module';
import {
  PurchaseDetailOrmEntity,
  PurchaseOrmEntity,
} from '../purchases/infrastructure/persistence/purchase.orm-entity';
import { CreatePurchaseReturnUseCase } from './application/create-purchase-return.use-case';
import { FindPurchaseReturnUseCase } from './application/find-purchase-return.use-case';
import { SearchPurchaseReturnsUseCase } from './application/search-purchase-returns.use-case';
import { PURCHASE_RETURN_CATALOG, PURCHASE_RETURN_REPOSITORY } from './domain/purchase-return.repository';
import { PurchaseReturnsController } from './infrastructure/http/purchase-returns.controller';
import {
  PurchaseReturnDetailOrmEntity,
  PurchaseReturnOrmEntity,
} from './infrastructure/persistence/purchase-return.orm-entity';
import { TypeOrmPurchaseReturnRepository } from './infrastructure/persistence/typeorm-purchase-return.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseReturnOrmEntity,
      PurchaseReturnDetailOrmEntity,
      PurchaseOrmEntity,
      PurchaseDetailOrmEntity,
    ]),
    AuthModule,
    AuditModule,
    StockModule,
  ],
  controllers: [PurchaseReturnsController],
  providers: [
    TypeOrmPurchaseReturnRepository,
    { provide: PURCHASE_RETURN_REPOSITORY, useExisting: TypeOrmPurchaseReturnRepository },
    { provide: PURCHASE_RETURN_CATALOG, useExisting: TypeOrmPurchaseReturnRepository },
    CreatePurchaseReturnUseCase,
    FindPurchaseReturnUseCase,
    SearchPurchaseReturnsUseCase,
  ],
})
export class PurchaseReturnsModule {}
