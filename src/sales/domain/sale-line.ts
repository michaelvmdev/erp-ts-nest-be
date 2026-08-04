import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';

export class InvalidSaleLineError extends InvalidInputError {
  readonly code = 'INVALID_SALE_LINE';

  constructor(message: string) {
    super(message);
  }
}

export interface SaleLineSnapshot {
  readonly item: number;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly partial: Money;
}

/**
 * Linea de detalle de una venta.
 *
 * Es una entidad hija, no un agregado: no existe fuera de su venta y no se
 * accede a ella por separado. Su identidad es el par (venta, item).
 *
 * `partial` no se recibe: se calcula como cantidad por precio unitario. Aceptar
 * un importe del cliente permitiria vender diez laptops declarando un parcial de
 * cero, y ademas el esquema tiene un CHECK que exige justamente esa igualdad.
 *
 * `unitPrice` tampoco se recibe: lo pone el caso de uso con el precio vigente
 * del producto. Se guarda en la linea, y no se consulta al producto cada vez,
 * porque una venta debe conservar el precio al que se vendio aunque el catalogo
 * cambie despues.
 */
export class SaleLine {
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
  }): SaleLine {
    if (!Number.isInteger(params.item) || params.item < 1) {
      throw new InvalidSaleLineError(
        `El item debe ser un entero mayor o igual a 1, se recibio ${params.item}.`,
      );
    }
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      throw new InvalidSaleLineError(
        `La cantidad debe ser un entero mayor o igual a 1, se recibio ${params.quantity}.`,
      );
    }
    if (params.quantity > SaleLine.MAX_QUANTITY) {
      throw new InvalidSaleLineError(
        `La cantidad no puede superar ${SaleLine.MAX_QUANTITY}, se recibio ${params.quantity}.`,
      );
    }
    return new SaleLine(
      params.item,
      params.productId,
      params.quantity,
      params.unitPrice,
    );
  }

  get partial(): Money {
    return Money.fromCentimos(this.quantity * this.unitPrice.centimos);
  }

  toSnapshot(): SaleLineSnapshot {
    return {
      item: this.item,
      productId: this.productId.value,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      partial: this.partial,
    };
  }
}
