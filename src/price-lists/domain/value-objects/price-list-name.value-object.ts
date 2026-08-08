import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidPriceListNameError extends InvalidInputError {
  readonly code = 'INVALID_PRICE_LIST_NAME';

  constructor(message: string) {
    super(message);
  }
}

/** price_list_name varchar(100) NOT NULL UNIQUE */
export class PriceListName {
  static readonly MAX = 100;

  private constructor(readonly value: string) {}

  static of(valor: string): PriceListName {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidPriceListNameError('El nombre de la lista de precio no puede estar vacio.');
    }
    if (limpio.length > PriceListName.MAX) {
      throw new InvalidPriceListNameError(
        `El nombre de la lista de precio no puede superar ${PriceListName.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new PriceListName(limpio);
  }

  get comparisonKey(): string {
    return this.value.trim().toLowerCase();
  }

  equals(otro: PriceListName): boolean {
    return this.comparisonKey === otro.comparisonKey;
  }

  toString(): string {
    return this.value;
  }
}
