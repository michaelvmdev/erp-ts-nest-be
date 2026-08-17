import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';

export class InvalidPurchaseReturnLineError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE_RETURN_LINE';
  constructor(message: string) { super(message); }
}

export interface PurchaseReturnLineSnapshot {
  readonly item: number;
  readonly productId: string;
  readonly quantity: number;
  readonly unitCost: Money;
  readonly partial: Money;
}

export class PurchaseReturnLine {
  static readonly MAX_QUANTITY = 9999;

  private constructor(
    readonly item: number,
    readonly productId: ProductId,
    readonly quantity: number,
    readonly unitCost: Money,
  ) {}

  static of(params: {
    item: number;
    productId: ProductId;
    quantity: number;
    unitCost: Money;
  }): PurchaseReturnLine {
    if (!Number.isInteger(params.item) || params.item < 1) {
      throw new InvalidPurchaseReturnLineError(
        `El item debe ser un entero mayor o igual a 1, se recibio ${params.item}.`,
      );
    }
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new InvalidPurchaseReturnLineError(
        `La cantidad debe ser un entero mayor o igual a 1, se recibio ${params.quantity}.`,
      );
    }
    if (params.quantity > PurchaseReturnLine.MAX_QUANTITY) {
      throw new InvalidPurchaseReturnLineError(
        `La cantidad no puede superar ${PurchaseReturnLine.MAX_QUANTITY}.`,
      );
    }
    return new PurchaseReturnLine(params.item, params.productId, params.quantity, params.unitCost);
  }

  get partial(): Money {
    return Money.fromCentimos(this.quantity * this.unitCost.centimos);
  }

  toSnapshot(): PurchaseReturnLineSnapshot {
    return {
      item: this.item,
      productId: this.productId.value,
      quantity: this.quantity,
      unitCost: this.unitCost,
      partial: this.partial,
    };
  }
}
