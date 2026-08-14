import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUnitUseCase } from './application/create-unit.use-case';
import { FindUnitUseCase } from './application/find-unit.use-case';
import { ListUnitsUseCase } from './application/list-units.use-case';
import { UpdateUnitUseCase } from './application/update-unit.use-case';
import { UNIT_REPOSITORY } from './domain/unit.repository';
import { UnitsController } from './infrastructure/http/units.controller';
import { UnitOrmEntity } from './infrastructure/persistence/unit.orm-entity';
import { TypeOrmUnitRepository } from './infrastructure/persistence/typeorm-unit.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOrmEntity]), AuthModule],
  controllers: [UnitsController],
  providers: [
    TypeOrmUnitRepository,
    { provide: UNIT_REPOSITORY, useExisting: TypeOrmUnitRepository },
    FindUnitUseCase,
    ListUnitsUseCase,
    CreateUnitUseCase,
    UpdateUnitUseCase,
  ],
  // products necesita la entidad ORM de unidades para el FK unit_id.
  exports: [TypeOrmModule],
})
export class UnitsModule {}
