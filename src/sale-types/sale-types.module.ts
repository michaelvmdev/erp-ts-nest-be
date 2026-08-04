import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListSaleTypesUseCase } from './application/list-sale-types.use-case';
import { SALE_TYPE_REPOSITORY } from './domain/sale-type.repository';
import { SaleTypesController } from './infrastructure/http/sale-types.controller';
import { SaleTypeOrmEntity } from './infrastructure/persistence/sale-type.orm-entity';
import { TypeOrmSaleTypeRepository } from './infrastructure/persistence/typeorm-sale-type.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SaleTypeOrmEntity])],
  controllers: [SaleTypesController],
  providers: [
    TypeOrmSaleTypeRepository,
    { provide: SALE_TYPE_REPOSITORY, useExisting: TypeOrmSaleTypeRepository },
    ListSaleTypesUseCase,
  ],
  exports: [TypeOrmModule],
})
export class SaleTypesModule {}
