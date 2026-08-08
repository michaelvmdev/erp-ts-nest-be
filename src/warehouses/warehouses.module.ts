import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateWarehouseUseCase } from './application/create-warehouse.use-case';
import { FindWarehouseUseCase } from './application/find-warehouse.use-case';
import { ListWarehousesUseCase } from './application/list-warehouses.use-case';
import { UpdateWarehouseUseCase } from './application/update-warehouse.use-case';
import { WAREHOUSE_REPOSITORY } from './domain/warehouse.repository';
import { WarehousesController } from './infrastructure/http/warehouses.controller';
import { WarehouseOrmEntity } from './infrastructure/persistence/warehouse.orm-entity';
import { TypeOrmWarehouseRepository } from './infrastructure/persistence/typeorm-warehouse.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseOrmEntity])],
  controllers: [WarehousesController],
  providers: [
    TypeOrmWarehouseRepository,
    { provide: WAREHOUSE_REPOSITORY, useExisting: TypeOrmWarehouseRepository },
    FindWarehouseUseCase,
    ListWarehousesUseCase,
    CreateWarehouseUseCase,
    UpdateWarehouseUseCase,
  ],
  // stock_movements referencia warehouses; se exporta para que ese modulo
  // pueda usar WarehouseOrmEntity sin redefinirla.
  exports: [TypeOrmModule],
})
export class WarehousesModule {}
