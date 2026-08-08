import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';

export class InvalidCreditNoteError extends InvalidInputError {
  readonly code = 'INVALID_CREDIT_NOTE';
  constructor(message: string) { super(message); }
}

export class CreditNoteSaleNotFoundError extends NotFoundError {
  readonly code = 'CREDIT_NOTE_SALE_NOT_FOUND';
  constructor(saleId: string) {
    super(`La venta ${saleId} no existe.`);
  }
}

export class CreditNoteProductNotInSaleError extends NotFoundError {
  readonly code = 'CREDIT_NOTE_PRODUCT_NOT_IN_SALE';
  constructor(productId: string) {
    super(`El producto ${productId} no pertenece a la venta referenciada.`);
  }
}

export class CreditNoteNotFoundError extends NotFoundError {
  readonly code = 'CREDIT_NOTE_NOT_FOUND';
  constructor(id: string) {
    super(`La nota de credito ${id} no existe.`);
  }
}
