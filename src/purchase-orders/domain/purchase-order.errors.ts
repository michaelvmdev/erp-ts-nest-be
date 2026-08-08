import { ConflictError, InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';

export class InvalidPurchaseOrderError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE_ORDER';
  constructor(message: string) { super(message); }
}

export class PurchaseOrderNotFoundError extends NotFoundError {
  readonly code = 'PURCHASE_ORDER_NOT_FOUND';
  constructor(id: string) { super(`La orden de compra ${id} no existe.`); }
}

export class PurchaseOrderSupplierNotFoundError extends NotFoundError {
  readonly code = 'PURCHASE_ORDER_SUPPLIER_NOT_FOUND';
  constructor(id: string) { super(`El proveedor ${id} no existe.`); }
}

export class PurchaseOrderStatusTransitionError extends ConflictError {
  readonly code = 'PURCHASE_ORDER_STATUS_TRANSITION_INVALID';
  constructor(from: string, to: string) {
    super(`No se puede pasar del estado "${from}" a "${to}".`);
  }
}
