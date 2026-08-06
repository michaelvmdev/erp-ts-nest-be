import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';

export class InvalidPurchaseLineError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE_LINE';

  constructor(message: string) {
    super(message);
  }
}

export interface PurchaseLineSnapshot {
  readonly item: number;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly partial: Money;
}

/**
 * Linea de detalle de una compra.
 *
 * Es una entidad hija, no un agregado: no existe fuera de su compra. Su
 * identidad es el par (compra, item).
 *
 * A diferencia de la venta, `unitPrice` SI se recibe: es el costo pagado al
 * proveedor, y ese dato no esta en el catalogo (products solo guarda el precio
 * de venta). `partial` en cambio se calcula como cantidad por costo unitario,
 * nunca se recibe: el esquema tiene un CHECK que exige justamente esa igualdad.
 */
export class PurchaseLine {
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
  }): PurchaseLine {
    if (!Number.isInteger(params.item) || params.item < 1) {
      throw new InvalidPurchaseLineError(
        `El item debe ser un entero mayor o igual a 1, se recibio ${params.item}.`,
      );
    }
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new InvalidPurchaseLineError(
        `La cantidad debe ser un entero mayor o igual a 1, se recibio ${params.quantity}.`,
      );
    }
    if (params.quantity > PurchaseLine.MAX_QUANTITY) {
      throw new InvalidPurchaseLineError(
        `La cantidad no puede superar ${PurchaseLine.MAX_QUANTITY}, se recibio ${params.quantity}.`,
      );
    }
    return new PurchaseLine(
      params.item,
      params.productId,
      params.quantity,
      params.unitPrice,
    );
  }

  get partial(): Money {
    return Money.fromCentimos(this.quantity * this.unitPrice.centimos);
  }

  toSnapshot(): PurchaseLineSnapshot {
    return {
      item: this.item,
      productId: this.productId.value,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      partial: this.partial,
    };
  }
}
