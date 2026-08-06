import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

/**
 * Identidad del agregado Compra.
 *
 * A diferencia de la venta, la compra no tiene un numero de comprobante: no es
 * un documento fiscal que esta API emita, asi que su unica identidad es este
 * UUID que genera el backend.
 */
export class PurchaseId extends UuidValueObject {
  static of(valor: string): PurchaseId {
    return new PurchaseId(this.ensureValid('El id de compra', valor));
  }
}
