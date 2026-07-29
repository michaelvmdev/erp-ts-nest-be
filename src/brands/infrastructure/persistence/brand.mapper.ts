import { Brand } from '../../domain/brand';
import { BrandDescription } from '../../domain/value-objects/brand-description.value-object';
import { BrandId } from '../../domain/value-objects/brand-id.value-object';
import { BrandOrmEntity } from './brand.orm-entity';

export class BrandMapper {
  static toDomain(row: BrandOrmEntity): Brand {
    return Brand.rehydrate({
      id: BrandId.of(row.brandId),
      description: BrandDescription.of(row.brandDescription),
      active: row.brandActive,
    });
  }

  static toPersistence(brand: Brand): BrandOrmEntity {
    const snapshot = brand.toSnapshot();

    const row = new BrandOrmEntity();
    row.brandId = snapshot.id;
    row.brandDescription = snapshot.description;
    row.brandActive = snapshot.active;
    return row;
  }
}
