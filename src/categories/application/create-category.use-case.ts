import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Category } from '../domain/category';
import { CategoryAlreadyExistsError } from '../domain/category.errors';
import { CATEGORY_REPOSITORY } from '../domain/category.repository';
import type { CategoryRepository } from '../domain/category.repository';
import { CategoryDescription } from '../domain/value-objects/category-description.value-object';
import { CategoryId } from '../domain/value-objects/category-id.value-object';
import { CreateCategoryCommand } from './category.commands';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const description = CategoryDescription.of(command.categoryDescription);

    // Sin esta comprobacion, el catalogo terminaria con "Audio", "audio" y
    // " Audio " como tres categorias distintas.
    const existente = await this.categories.findByDescription(description);
    if (existente) {
      throw new CategoryAlreadyExistsError(description.value);
    }

    // El id lo genera el backend, igual que en marcas y productos.
    const category = Category.create({
      id: CategoryId.of(randomUUID()),
      description,
      active: command.categoryActive,
    });

    await this.categories.insert(category);
    return category;
  }
}
