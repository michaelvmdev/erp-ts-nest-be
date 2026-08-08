import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PriceList } from '../domain/price-list';
import { PriceListNameAlreadyExistsError } from '../domain/price-list.errors';
import { PRICE_LIST_REPOSITORY } from '../domain/price-list.repository';
import type { PriceListRepository } from '../domain/price-list.repository';
import { PriceListId } from '../domain/value-objects/price-list-id.value-object';
import { PriceListName } from '../domain/value-objects/price-list-name.value-object';
import { CreatePriceListCommand } from './price-list.commands';

@Injectable()
export class CreatePriceListUseCase {
  constructor(
    @Inject(PRICE_LIST_REPOSITORY)
    private readonly priceLists: PriceListRepository,
  ) {}

  async execute(command: CreatePriceListCommand): Promise<PriceList> {
    const name = PriceListName.of(command.priceListName);

    const existente = await this.priceLists.findByName(name);
    if (existente) {
      throw new PriceListNameAlreadyExistsError(name.value);
    }

    const priceList = PriceList.create({
      id: PriceListId.of(randomUUID()),
      name,
      description: command.priceListDescription ?? null,
      active: command.priceListActive,
    });

    await this.priceLists.insert(priceList);
    return priceList;
  }
}
