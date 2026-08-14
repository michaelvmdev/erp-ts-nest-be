import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePriceListUseCase } from './application/create-price-list.use-case';
import { FindPriceListUseCase } from './application/find-price-list.use-case';
import { ListPriceListsUseCase } from './application/list-price-lists.use-case';
import { RemovePriceListItemUseCase } from './application/remove-price-list-item.use-case';
import { SetPriceListItemsUseCase } from './application/set-price-list-items.use-case';
import { UpdatePriceListUseCase } from './application/update-price-list.use-case';
import { PRICE_LIST_REPOSITORY } from './domain/price-list.repository';
import { PriceListItemOrmEntity } from './infrastructure/persistence/price-list-item.orm-entity';
import { PriceListOrmEntity } from './infrastructure/persistence/price-list.orm-entity';
import { TypeOrmPriceListRepository } from './infrastructure/persistence/typeorm-price-list.repository';
import { PriceListsController } from './infrastructure/http/price-lists.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PriceListOrmEntity, PriceListItemOrmEntity]), AuthModule],
  controllers: [PriceListsController],
  providers: [
    TypeOrmPriceListRepository,
    { provide: PRICE_LIST_REPOSITORY, useExisting: TypeOrmPriceListRepository },
    FindPriceListUseCase,
    ListPriceListsUseCase,
    CreatePriceListUseCase,
    UpdatePriceListUseCase,
    SetPriceListItemsUseCase,
    RemovePriceListItemUseCase,
  ],
  exports: [TypeOrmModule],
})
export class PriceListsModule {}
