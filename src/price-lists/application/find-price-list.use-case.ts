import { Inject, Injectable } from '@nestjs/common';
import { PriceList } from '../domain/price-list';
import { PriceListNotFoundError } from '../domain/price-list.errors';
import { PRICE_LIST_REPOSITORY } from '../domain/price-list.repository';
import type { PriceListRepository } from '../domain/price-list.repository';
import { PriceListId } from '../domain/value-objects/price-list-id.value-object';

@Injectable()
export class FindPriceListUseCase {
  constructor(
    @Inject(PRICE_LIST_REPOSITORY)
    private readonly priceLists: PriceListRepository,
  ) {}

  async execute(rawId: string): Promise<PriceList> {
    const id = PriceListId.of(rawId);
    const priceList = await this.priceLists.findById(id);
    if (!priceList) {
      throw new PriceListNotFoundError(id.value);
    }
    return priceList;
  }
}
