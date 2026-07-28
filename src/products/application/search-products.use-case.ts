import { Inject, Injectable } from '@nestjs/common';
import { Page, PageRequest } from '../../shared/domain/pagination';
import { Product } from '../domain/product';
import {
  PriceRange,
  ProductSearchCriteria,
} from '../domain/product-search.criteria';
import { PRODUCT_REPOSITORY } from '../domain/product.repository';
import type { ProductRepository } from '../domain/product.repository';
import { BrandId } from '../domain/value-objects/identifiers.value-object';
import { Money } from '../domain/value-objects/money.value-object';
import { SearchProductsQuery } from './product.commands';

@Injectable()
export class SearchProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(query: SearchProductsQuery): Promise<Page<Product>> {
    // Traduce el DTO plano a value objects. Cualquier valor invalido revienta
    // aca, antes de tocar la base, y sale como 400 con un mensaje util.
    const criteria = ProductSearchCriteria.of({
      description: query.productDescription,
      priceRange: PriceRange.of(
        query.productUnitPrice?.min != null
          ? Money.fromNumber(query.productUnitPrice.min)
          : null,
        query.productUnitPrice?.max != null
          ? Money.fromNumber(query.productUnitPrice.max)
          : null,
      ),
      brandId: query.brandId ? BrandId.of(query.brandId) : null,
      active: query.productActive ?? null,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: PageRequest.of(query.page, query.limit),
    });

    return this.products.search(criteria);
  }
}
