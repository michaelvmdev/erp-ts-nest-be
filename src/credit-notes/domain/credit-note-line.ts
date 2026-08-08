import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';

export class InvalidCreditNoteLineError extends InvalidInputError {
  readonly code = 'INVALID_CREDIT_NOTE_LINE';
  constructor(message: string) { super(message); }
}

export interface CreditNoteLineSnapshot {
  readonly item: number;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly partial: Money;
}

export class CreditNoteLine {
  static readonly MAX_QUANTITY = 9999;

  private constructor(
    readonly item: number,
    readonly productId: ProductId,
    readonly quantity: number,
    readonly unitPrice: Money,
  ) {}

  static of(params: {
    item: number;
    productId: ProductId;
    quantity: number;
    unitPrice: Money;
  }): CreditNoteLine {
    if (!Number.isInteger(params.item) || params.item < 1) {
      throw new InvalidCreditNoteLineError(
        `El item debe ser un entero mayor o igual a 1, se recibio ${params.item}.`,
      );
    }
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new InvalidCreditNoteLineError(
        `La cantidad debe ser un entero mayor o igual a 1, se recibio ${params.quantity}.`,
      );
    }
    if (params.quantity > CreditNoteLine.MAX_QUANTITY) {
      throw new InvalidCreditNoteLineError(
        `La cantidad no puede superar ${CreditNoteLine.MAX_QUANTITY}.`,
      );
    }
    return new CreditNoteLine(params.item, params.productId, params.quantity, params.unitPrice);
  }

  get partial(): Money {
    return Money.fromCentimos(this.quantity * this.unitPrice.centimos);
  }

  toSnapshot(): CreditNoteLineSnapshot {
    return {
      item: this.item,
      productId: this.productId.value,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      partial: this.partial,
    };
  }
}
