import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { Brand } from '../domain/brand';
import { BrandSearchCriteria } from '../domain/brand-search.criteria';
import { BRAND_REPOSITORY } from '../domain/brand.repository';
import type { BrandRepository } from '../domain/brand.repository';
import { ListBrandsQuery } from './brand.commands';

@Injectable()
export class ListBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brands: BrandRepository,
  ) {}

  async execute(query: ListBrandsQuery): Promise<Page<Brand>> {
    const criteria = BrandSearchCriteria.of({
      description: query.brandDescription,
      active: query.brandActive ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.brands.search(criteria);
  }
}
