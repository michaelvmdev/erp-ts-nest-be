import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class CreditNoteId extends UuidValueObject {
  static of(valor: string): CreditNoteId {
    return new CreditNoteId(this.ensureValid('El id de nota de credito', valor));
  }
}
