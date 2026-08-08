import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidWarehouseCodeError extends InvalidInputError {
  readonly code = 'INVALID_WAREHOUSE_CODE';

  constructor(message: string) {
    super(message);
  }
}

/** warehouse_code varchar(20) NOT NULL UNIQUE — mayusculas, digitos y guiones */
export class WarehouseCode {
  static readonly MAX = 20;
  private static readonly PATTERN = /^[A-Z0-9-]+$/;

  private constructor(readonly value: string) {}

  static of(valor: string): WarehouseCode {
    const limpio = valor?.trim().toUpperCase() ?? '';

    if (limpio.length === 0) {
      throw new InvalidWarehouseCodeError('El codigo de almacen no puede estar vacio.');
    }
    if (limpio.length > WarehouseCode.MAX) {
      throw new InvalidWarehouseCodeError(
        `El codigo de almacen no puede superar ${WarehouseCode.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    if (!WarehouseCode.PATTERN.test(limpio)) {
      throw new InvalidWarehouseCodeError(
        'El codigo de almacen solo puede contener letras mayusculas, digitos y guiones.',
      );
    }
    return new WarehouseCode(limpio);
  }

  get comparisonKey(): string {
    return this.value;
  }

  equals(otro: WarehouseCode): boolean {
    return this.comparisonKey === otro.comparisonKey;
  }

  toString(): string {
    return this.value;
  }
}
