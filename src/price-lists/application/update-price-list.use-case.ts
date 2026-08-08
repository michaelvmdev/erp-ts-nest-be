import { Inject, Injectable } from '@nestjs/common';
import { PriceList } from '../domain/price-list';
import { PriceListNameAlreadyExistsError, PriceListNotFoundError } from '../domain/price-list.errors';
import { PRICE_LIST_REPOSITORY } from '../domain/price-list.repository';
import type { PriceListRepository } from '../domain/price-list.repository';
import { PriceListId } from '../domain/value-objects/price-list-id.value-object';
import { PriceListName } from '../domain/value-objects/price-list-name.value-object';
import { UpdatePriceListCommand } from './price-list.commands';

@Injectable()
export class UpdatePriceListUseCase {
  constructor(
    @Inject(PRICE_LIST_REPOSITORY)
    private readonly priceLists: PriceListRepository,
  ) {}

  async execute(rawId: string, command: UpdatePriceListCommand): Promise<PriceList> {
    const id = PriceListId.of(rawId);

    const priceList = await this.priceLists.findById(id);
    if (!priceList) {
      throw new PriceListNotFoundError(id.value);
    }

    if (command.priceListName !== undefined) {
      const name = PriceListName.of(command.priceListName);
      const otra = await this.priceLists.findByName(name, id);
      if (otra) {
        throw new PriceListNameAlreadyExistsError(name.value);
      }
      priceList.rename(name);
    }

    if (command.priceListDescription !== undefined) {
      priceList.changeDescription(command.priceListDescription);
    }

    if (command.priceListActive !== undefined) {
      if (command.priceListActive) {
        priceList.activate();
      } else {
        priceList.deactivate();
      }
    }

    await this.priceLists.updateMeta(priceList);
    return priceList;
  }
}
