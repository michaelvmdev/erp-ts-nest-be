import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoryNotFoundError } from '../domain/category.errors';
import { CATEGORY_REPOSITORY } from '../domain/category.repository';
import type { CategoryRepository } from '../domain/category.repository';
import { CategoryId } from '../domain/value-objects/category-id.value-object';

@Injectable()
export class FindCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(rawCategoryId: string): Promise<Category> {
    const id = CategoryId.of(rawCategoryId);

    const category = await this.categories.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id.value);
    }
    return category;
  }
}
