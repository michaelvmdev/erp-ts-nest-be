import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class QuoteId extends UuidValueObject {
  static of(valor: string): QuoteId {
    return new QuoteId(this.ensureValid('El id de cotizacion', valor));
  }
}
