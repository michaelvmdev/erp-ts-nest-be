import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import {
  CategoryAlreadyExistsError,
  CategoryNotFoundError,
} from '../domain/category.errors';
import { CATEGORY_REPOSITORY } from '../domain/category.repository';
import type { CategoryRepository } from '../domain/category.repository';
import { CategoryDescription } from '../domain/value-objects/category-description.value-object';
import { CategoryId } from '../domain/value-objects/category-id.value-object';
import { UpdateCategoryCommand } from './category.commands';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(
    rawCategoryId: string,
    command: UpdateCategoryCommand,
  ): Promise<Category> {
    const id = CategoryId.of(rawCategoryId);

    const category = await this.categories.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id.value);
    }

    // Semantica PATCH: se compara contra `undefined`, no por veracidad, para que
    // `false` se aplique como el valor legitimo que es. Justamente el caso de
    // desactivar la categoria.
    if (command.categoryDescription !== undefined) {
      const description = CategoryDescription.of(command.categoryDescription);

      // Se excluye la propia categoria de la busqueda: renombrar "Audio" a
      // "audio" no debe chocar consigo misma.
      const otra = await this.categories.findByDescription(description, id);
      if (otra) {
        throw new CategoryAlreadyExistsError(description.value);
      }
      category.rename(description);
    }

    if (command.categoryActive !== undefined) {
      if (command.categoryActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }

    await this.categories.update(category);
    return category;
  }
}
