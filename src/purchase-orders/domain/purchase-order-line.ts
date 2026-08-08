import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';

export class InvalidPurchaseOrderLineError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE_ORDER_LINE';
  constructor(message: string) { super(message); }
}

export interface PurchaseOrderLineSnapshot {
  readonly item: number;
  readonly productId: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly unitPrice: Money;
  readonly partial: Money;
}

export class PurchaseOrderLine {
  private constructor(
    readonly item: number,
    readonly productId: ProductId,
    readonly quantityOrdered: number,
    readonly quantityReceived: number,
    readonly unitPrice: Money,
  ) {}

  static of(params: {
    item: number;
    productId: ProductId;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: Money;
  }): PurchaseOrderLine {
    if (!Number.isInteger(params.item) || params.item < 1) {
      throw new InvalidPurchaseOrderLineError(`El item debe ser un entero >= 1, se recibio ${params.item}.`);
    }
    if (params.quantityOrdered <= 0) {
      throw new InvalidPurchaseOrderLineError(`La cantidad pedida debe ser mayor a 0.`);
    }
    if (params.quantityReceived < 0) {
      throw new InvalidPurchaseOrderLineError(`La cantidad recibida no puede ser negativa.`);
    }
    return new PurchaseOrderLine(
      params.item, params.productId,
      params.quantityOrdered, params.quantityReceived, params.unitPrice,
    );
  }

  get partial(): Money {
    return Money.fromCentimos(Math.round(this.quantityOrdered * this.unitPrice.centimos));
  }

  toSnapshot(): PurchaseOrderLineSnapshot {
    return {
      item: this.item,
      productId: this.productId.value,
      quantityOrdered: this.quantityOrdered,
      quantityReceived: this.quantityReceived,
      unitPrice: this.unitPrice,
      partial: this.partial,
    };
  }
}
