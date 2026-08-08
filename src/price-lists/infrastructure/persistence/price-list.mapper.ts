import { PriceList } from '../../domain/price-list';
import { PriceListId } from '../../domain/value-objects/price-list-id.value-object';
import { PriceListName } from '../../domain/value-objects/price-list-name.value-object';
import { PriceListItemOrmEntity } from './price-list-item.orm-entity';
import { PriceListOrmEntity } from './price-list.orm-entity';

export class PriceListMapper {
  static toDomain(row: PriceListOrmEntity, itemRows: PriceListItemOrmEntity[] = []): PriceList {
    return PriceList.rehydrate({
      id: PriceListId.of(row.priceListId),
      name: PriceListName.of(row.priceListName),
      description: row.priceListDescription,
      active: row.priceListActive,
      items: itemRows.map((i) => ({
        productId: i.productId,
        unitPrice: Number(i.unitPrice),
      })),
    });
  }

  static toPersistenceMeta(priceList: PriceList): PriceListOrmEntity {
    const s = priceList.toSnapshot();
    const row = new PriceListOrmEntity();
    row.priceListId = s.id;
    row.priceListName = s.name;
    row.priceListDescription = s.description;
    row.priceListActive = s.active;
    return row;
  }

  static itemToPersistence(
    priceListId: string,
    productId: string,
    unitPrice: number,
  ): PriceListItemOrmEntity {
    const row = new PriceListItemOrmEntity();
    row.priceListId = priceListId;
    row.productId = productId;
    row.unitPrice = String(unitPrice);
    return row;
  }
}
