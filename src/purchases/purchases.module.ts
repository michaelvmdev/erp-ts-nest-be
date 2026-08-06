import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { SupplierOrmEntity } from '../suppliers/infrastructure/persistence/supplier.orm-entity';
import { CreatePurchaseUseCase } from './application/create-purchase.use-case';
import { FindPurchaseUseCase } from './application/find-purchase.use-case';
import { SearchPurchasesUseCase } from './application/search-purchases.use-case';
import { UpdatePurchaseUseCase } from './application/update-purchase.use-case';
import {
  PURCHASE_CATALOG,
  PURCHASE_REPOSITORY,
} from './domain/purchase.repository';
import { PurchasesController } from './infrastructure/http/purchases.controller';
import {
  PurchaseDetailOrmEntity,
  PurchaseOrmEntity,
} from './infrastructure/persistence/purchase.orm-entity';
import { TypeOrmPurchaseRepository } from './infrastructure/persistence/typeorm-purchase.repository';

@Module({
  imports: [
    // Las entidades de proveedores y productos se registran aqui porque el
    // adaptador las consulta para validar existencia y estado. Son lecturas
    // hacia otros agregados, no escrituras: las compras nunca los modifican.
    TypeOrmModule.forFeature([
      PurchaseOrmEntity,
      PurchaseDetailOrmEntity,
      SupplierOrmEntity,
      ProductOrmEntity,
    ]),
  ],
  controllers: [PurchasesController],
  providers: [
    TypeOrmPurchaseRepository,
    { provide: PURCHASE_REPOSITORY, useExisting: TypeOrmPurchaseRepository },
    // useExisting: el mismo adaptador satisface los dos puertos y debe
    // compartirse la instancia, no crear una por token.
    { provide: PURCHASE_CATALOG, useExisting: TypeOrmPurchaseRepository },
    FindPurchaseUseCase,
    SearchPurchasesUseCase,
    CreatePurchaseUseCase,
    UpdatePurchaseUseCase,
  ],
})
export class PurchasesModule {}
