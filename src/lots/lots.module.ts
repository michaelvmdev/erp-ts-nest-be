import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { WarehouseOrmEntity } from '../warehouses/infrastructure/persistence/warehouse.orm-entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CreateLotUseCase } from './application/create-lot.use-case';
import { FindLotUseCase } from './application/find-lot.use-case';
import { SearchLotsUseCase } from './application/search-lots.use-case';
import { LOT_REPOSITORY } from './domain/lot.repository';
import { LotOrmEntity } from './infrastructure/persistence/lot.orm-entity';
import { TypeOrmLotRepository } from './infrastructure/persistence/typeorm-lot.repository';
import { LotsController } from './infrastructure/http/lots.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LotOrmEntity, ProductOrmEntity, WarehouseOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [LotsController],
  providers: [
    TypeOrmLotRepository,
    { provide: LOT_REPOSITORY, useExisting: TypeOrmLotRepository },
    CreateLotUseCase,
    FindLotUseCase,
    SearchLotsUseCase,
  ],
  exports: [LOT_REPOSITORY],
})
export class LotsModule {}
