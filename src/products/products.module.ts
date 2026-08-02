import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateProductUseCase } from './application/create-product.use-case';
import { DeleteProductUseCase } from './application/delete-product.use-case';
import { FindProductUseCase } from './application/find-product.use-case';
import { SearchProductsUseCase } from './application/search-products.use-case';
import { UpdateProductUseCase } from './application/update-product.use-case';
import {
  BRAND_EXISTENCE_CHECKER,
  CATEGORY_EXISTENCE_CHECKER,
  PRODUCT_REPOSITORY,
} from './domain/product.repository';
import { BrandOrmEntity } from '../brands/infrastructure/persistence/brand.orm-entity';
import { CategoryOrmEntity } from '../categories/infrastructure/persistence/category.orm-entity';
import { ProductsController } from './infrastructure/http/products.controller';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { TypeOrmCategoryExistenceChecker } from './infrastructure/persistence/typeorm-category-existence.checker';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';

/**
 * Cableado del modulo: aqui, y solo aqui, se decide que adaptador concreto
 * satisface cada puerto del dominio.
 *
 * Los casos de uso piden PRODUCT_REPOSITORY y reciben la implementacion con
 * TypeORM. Cambiarla por una en memoria para tests, o por otra contra un
 * servicio externo, es reemplazar estas dos lineas: ni el dominio ni la
 * aplicacion se enteran.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductOrmEntity,
      BrandOrmEntity,
      CategoryOrmEntity,
    ]),
  ],
  controllers: [ProductsController],
  providers: [
    TypeOrmProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: TypeOrmProductRepository },
    // useExisting y no useClass: el mismo adaptador implementa los dos puertos,
    // asi que debe compartirse la instancia en lugar de crear una por token.
    { provide: BRAND_EXISTENCE_CHECKER, useExisting: TypeOrmProductRepository },
    // La comprobacion de categoria va en su propio adaptador: no puede compartir
    // el metodo `exists` de la marca porque el tipo del argumento difiere.
    TypeOrmCategoryExistenceChecker,
    {
      provide: CATEGORY_EXISTENCE_CHECKER,
      useExisting: TypeOrmCategoryExistenceChecker,
    },
    FindProductUseCase,
    SearchProductsUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
  ],
})
export class ProductsModule {}
