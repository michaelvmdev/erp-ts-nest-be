import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class WarehouseId extends UuidValueObject {
  static of(valor: string): WarehouseId {
    return new WarehouseId(this.ensureValid('El id de almacen', valor));
  }
}
