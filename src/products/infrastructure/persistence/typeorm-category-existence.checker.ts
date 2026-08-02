import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryOrmEntity } from '../../../categories/infrastructure/persistence/category.orm-entity';
import { CategoryExistenceChecker } from '../../domain/product.repository';
import { CategoryId } from '../../domain/value-objects/identifiers.value-object';

/**
 * Adaptador del puerto CategoryExistenceChecker.
 *
 * Va en una clase aparte de TypeOrmProductRepository a proposito: aquel ya
 * implementa BrandExistenceChecker con un metodo `exists`, y una segunda
 * interfaz con el mismo nombre pero otro tipo de argumento chocaria. Separar la
 * comprobacion de categoria mantiene cada puerto con una sola responsabilidad.
 */
@Injectable()
export class TypeOrmCategoryExistenceChecker implements CategoryExistenceChecker {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly categories: Repository<CategoryOrmEntity>,
  ) {}

  async exists(categoryId: CategoryId): Promise<boolean> {
    return this.categories.existsBy({ categoryId: categoryId.value });
  }
}
