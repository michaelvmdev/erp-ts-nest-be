import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { PriceList } from '../domain/price-list';
import { PriceListSearchCriteria } from '../domain/price-list-search.criteria';
import { PRICE_LIST_REPOSITORY } from '../domain/price-list.repository';
import type { PriceListRepository } from '../domain/price-list.repository';
import { ListPriceListsQuery } from './price-list.commands';

@Injectable()
export class ListPriceListsUseCase {
  constructor(
    @Inject(PRICE_LIST_REPOSITORY)
    private readonly priceLists: PriceListRepository,
  ) {}

  async execute(query: ListPriceListsQuery): Promise<Page<PriceList>> {
    const criteria = PriceListSearchCriteria.of({
      name: query.priceListName,
      active: query.priceListActive ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.priceLists.search(criteria);
  }
}
