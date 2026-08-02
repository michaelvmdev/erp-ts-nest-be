import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCategoryUseCase } from './application/create-category.use-case';
import { DeleteCategoryUseCase } from './application/delete-category.use-case';
import { FindCategoryUseCase } from './application/find-category.use-case';
import { ListCategoriesUseCase } from './application/list-categories.use-case';
import { UpdateCategoryUseCase } from './application/update-category.use-case';
import { CATEGORY_REPOSITORY } from './domain/category.repository';
import { CategoriesController } from './infrastructure/http/categories.controller';
import { CategoryOrmEntity } from './infrastructure/persistence/category.orm-entity';
import { TypeOrmCategoryRepository } from './infrastructure/persistence/typeorm-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoriesController],
  providers: [
    TypeOrmCategoryRepository,
    { provide: CATEGORY_REPOSITORY, useExisting: TypeOrmCategoryRepository },
    FindCategoryUseCase,
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
  // products necesita la entidad ORM de categorias para su comprobacion de
  // existencia; se exporta desde aqui para que haya una sola definicion.
  exports: [TypeOrmModule],
})
export class CategoriesModule {}
