import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class UnitId extends UuidValueObject {
  static of(valor: string): UnitId {
    return new UnitId(this.ensureValid('El id de unidad', valor));
  }
}
