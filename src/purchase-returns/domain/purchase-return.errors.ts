import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';

export class InvalidPurchaseReturnError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE_RETURN';
  constructor(message: string) { super(message); }
}

export class PurchaseReturnNotFoundError extends NotFoundError {
  readonly code = 'PURCHASE_RETURN_NOT_FOUND';
  constructor(id: string) {
    super(`Devolucion de compra con id "${id}" no encontrada.`);
  }
}

export class PurchaseReturnPurchaseNotFoundError extends NotFoundError {
  readonly code = 'PURCHASE_RETURN_PURCHASE_NOT_FOUND';
  constructor(purchaseId: string) {
    super(`Compra con id "${purchaseId}" no encontrada.`);
  }
}

export class PurchaseReturnProductNotInPurchaseError extends InvalidInputError {
  readonly code = 'PURCHASE_RETURN_PRODUCT_NOT_IN_PURCHASE';
  constructor(productId: string) {
    super(`El producto "${productId}" no pertenece a la compra referenciada.`);
  }
}
