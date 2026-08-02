import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { Category } from '../domain/category';
import { CategorySearchCriteria } from '../domain/category-search.criteria';
import { CATEGORY_REPOSITORY } from '../domain/category.repository';
import type { CategoryRepository } from '../domain/category.repository';
import { ListCategoriesQuery } from './category.commands';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(query: ListCategoriesQuery): Promise<Page<Category>> {
    const criteria = CategorySearchCriteria.of({
      description: query.categoryDescription,
      active: query.categoryActive ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.categories.search(criteria);
  }
}
