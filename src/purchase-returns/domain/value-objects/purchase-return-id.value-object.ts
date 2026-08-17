import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class PurchaseReturnId extends UuidValueObject {
  static of(valor: string): PurchaseReturnId {
    return new PurchaseReturnId(this.ensureValid('El id de devolucion de compra', valor));
  }
}
