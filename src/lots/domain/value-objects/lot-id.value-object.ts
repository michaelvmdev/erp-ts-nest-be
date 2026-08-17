import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class LotId extends UuidValueObject {
  static of(valor: string): LotId {
    return new LotId(this.ensureValid('El id de lote', valor));
  }
}
