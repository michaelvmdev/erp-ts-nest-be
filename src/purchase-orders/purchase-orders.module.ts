import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { StockModule } from '../stock/stock.module';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { SupplierOrmEntity } from '../suppliers/infrastructure/persistence/supplier.orm-entity';
import { CreatePurchaseOrderUseCase } from './application/create-purchase-order.use-case';
import { FindPurchaseOrderUseCase } from './application/find-purchase-order.use-case';
import { SearchPurchaseOrdersUseCase } from './application/search-purchase-orders.use-case';
import { UpdatePurchaseOrderUseCase } from './application/update-purchase-order.use-case';
import {
  PURCHASE_ORDER_CATALOG,
  PURCHASE_ORDER_REPOSITORY,
} from './domain/purchase-order.repository';
import { PurchaseOrdersController } from './infrastructure/http/purchase-orders.controller';
import {
  PurchaseOrderDetailOrmEntity,
  PurchaseOrderOrmEntity,
} from './infrastructure/persistence/purchase-order.orm-entity';
import { TypeOrmPurchaseOrderRepository } from './infrastructure/persistence/typeorm-purchase-order.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrderOrmEntity,
      PurchaseOrderDetailOrmEntity,
      SupplierOrmEntity,
      ProductOrmEntity,
    ]),
    AuthModule,
    AuditModule,
    StockModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [
    TypeOrmPurchaseOrderRepository,
    { provide: PURCHASE_ORDER_REPOSITORY, useExisting: TypeOrmPurchaseOrderRepository },
    { provide: PURCHASE_ORDER_CATALOG, useExisting: TypeOrmPurchaseOrderRepository },
    CreatePurchaseOrderUseCase,
    FindPurchaseOrderUseCase,
    SearchPurchaseOrdersUseCase,
    UpdatePurchaseOrderUseCase,
  ],
})
export class PurchaseOrdersModule {}
