import { SaleType } from '../../domain/sale-type';
import { SaleTypeId } from '../../domain/sale-type-id.value-object';
import { SaleTypeOrmEntity } from './sale-type.orm-entity';

export class SaleTypeMapper {
  static toDomain(row: SaleTypeOrmEntity): SaleType {
    return SaleType.rehydrate({
      id: SaleTypeId.of(row.saleTypeId),
      description: row.saleTypeDescription,
      code: row.saleTypeCode,
    });
  }
}
