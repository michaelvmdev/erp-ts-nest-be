import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';

export class InvalidQuoteLineError extends InvalidInputError {
  readonly code = 'INVALID_QUOTE_LINE';
  constructor(message: string) {
    super(message);
  }
}

export interface QuoteLineSnapshot {
  readonly item: number;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly partial: Money;
}

export class QuoteLine {
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
  }): QuoteLine {
    if (!Number.isInteger(params.item) || params.item < 1) {
      throw new InvalidQuoteLineError(
        `El item debe ser un entero mayor o igual a 1, se recibio ${params.item}.`,
      );
    }
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new InvalidQuoteLineError(
        `La cantidad debe ser un entero mayor o igual a 1, se recibio ${params.quantity}.`,
      );
    }
    if (params.quantity > QuoteLine.MAX_QUANTITY) {
      throw new InvalidQuoteLineError(
        `La cantidad no puede superar ${QuoteLine.MAX_QUANTITY}, se recibio ${params.quantity}.`,
      );
    }
    return new QuoteLine(params.item, params.productId, params.quantity, params.unitPrice);
  }

  get partial(): Money {
    return Money.fromCentimos(this.quantity * this.unitPrice.centimos);
  }

  toSnapshot(): QuoteLineSnapshot {
    return {
      item: this.item,
      productId: this.productId.value,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      partial: this.partial,
    };
  }
}
