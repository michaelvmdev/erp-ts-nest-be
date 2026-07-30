import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListDepartmentsUseCase } from './application/list-departments.use-case';
import { ListDistrictsUseCase } from './application/list-districts.use-case';
import { ListProvincesUseCase } from './application/list-provinces.use-case';
import { UBIGEO_REPOSITORY } from './domain/ubigeo.repository';
import { UbigeoController } from './infrastructure/http/ubigeo.controller';
import { DepartmentOrmEntity } from './infrastructure/persistence/department.orm-entity';
import { DistrictOrmEntity } from './infrastructure/persistence/district.orm-entity';
import { ProvinceOrmEntity } from './infrastructure/persistence/province.orm-entity';
import { TypeOrmUbigeoRepository } from './infrastructure/persistence/typeorm-ubigeo.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DepartmentOrmEntity,
      ProvinceOrmEntity,
      DistrictOrmEntity,
    ]),
  ],
  controllers: [UbigeoController],
  providers: [
    TypeOrmUbigeoRepository,
    {
      provide: UBIGEO_REPOSITORY,
      useExisting: TypeOrmUbigeoRepository,
    },
    ListDepartmentsUseCase,
    ListProvincesUseCase,
    ListDistrictsUseCase,
  ],
})
export class UbigeoModule {}
