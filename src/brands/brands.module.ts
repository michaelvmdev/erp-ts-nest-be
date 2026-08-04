import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBrandUseCase } from './application/create-brand.use-case';
import { DeleteBrandUseCase } from './application/delete-brand.use-case';
import { FindBrandUseCase } from './application/find-brand.use-case';
import { ListBrandsUseCase } from './application/list-brands.use-case';
import { UpdateBrandUseCase } from './application/update-brand.use-case';
import { BRAND_REPOSITORY } from './domain/brand.repository';
import { BrandsController } from './infrastructure/http/brands.controller';
import { BrandOrmEntity } from './infrastructure/persistence/brand.orm-entity';
import { TypeOrmBrandRepository } from './infrastructure/persistence/typeorm-brand.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BrandOrmEntity])],
  controllers: [BrandsController],
  providers: [
    TypeOrmBrandRepository,
    { provide: BRAND_REPOSITORY, useExisting: TypeOrmBrandRepository },
    FindBrandUseCase,
    ListBrandsUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase,
  ],
  // products necesita la entidad ORM de marcas para su comprobacion de
  // existencia; se exporta desde aqui para que haya una sola definicion.
  exports: [TypeOrmModule],
})
export class BrandsModule {}
