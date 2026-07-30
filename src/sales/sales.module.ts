import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from '../clients/infrastructure/persistence/client.orm-entity';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { CreateSaleUseCase } from './application/create-sale.use-case';
import { FindSaleUseCase } from './application/find-sale.use-case';
import { SearchSalesUseCase } from './application/search-sales.use-case';
import { UpdateSaleUseCase } from './application/update-sale.use-case';
import { SALE_CATALOG, SALE_REPOSITORY } from './domain/sale.repository';
import { SalesController } from './infrastructure/http/sales.controller';
import {
  SaleDetailOrmEntity,
  SaleOrmEntity,
} from './infrastructure/persistence/sale.orm-entity';
import { TypeOrmSaleRepository } from './infrastructure/persistence/typeorm-sale.repository';

@Module({
  imports: [
    // Las entidades de clientes y productos se registran aqui porque el
    // adaptador las consulta para resolver precios y estados. Son lecturas hacia
    // otros agregados, no escrituras: las ventas nunca modifican un producto.
    TypeOrmModule.forFeature([
      SaleOrmEntity,
      SaleDetailOrmEntity,
      ClientOrmEntity,
      ProductOrmEntity,
    ]),
  ],
  controllers: [SalesController],
  providers: [
    TypeOrmSaleRepository,
    { provide: SALE_REPOSITORY, useExisting: TypeOrmSaleRepository },
    // useExisting: el mismo adaptador satisface los dos puertos y debe
    // compartirse la instancia, no crear una por token.
    { provide: SALE_CATALOG, useExisting: TypeOrmSaleRepository },
    FindSaleUseCase,
    SearchSalesUseCase,
    CreateSaleUseCase,
    UpdateSaleUseCase,
  ],
})
export class SalesModule {}
