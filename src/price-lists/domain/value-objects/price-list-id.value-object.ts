import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class PriceListId extends UuidValueObject {
  static of(valor: string): PriceListId {
    return new PriceListId(this.ensureValid('El id de lista de precio', valor));
  }
}
