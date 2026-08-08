import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class PurchaseOrderId extends UuidValueObject {
  static of(valor: string): PurchaseOrderId {
    return new PurchaseOrderId(this.ensureValid('El id de orden de compra', valor));
  }
}
