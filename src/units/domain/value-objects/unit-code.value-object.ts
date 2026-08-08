import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidUnitCodeError extends InvalidInputError {
  readonly code = 'INVALID_UNIT_CODE';

  constructor(message: string) {
    super(message);
  }
}

/** unit_code varchar(10) NOT NULL UNIQUE — solo mayusculas y digitos */
export class UnitCode {
  static readonly MAX = 10;
  private static readonly PATTERN = /^[A-Z0-9]+$/;

  private constructor(readonly value: string) {}

  static of(valor: string): UnitCode {
    const limpio = valor?.trim().toUpperCase() ?? '';

    if (limpio.length === 0) {
      throw new InvalidUnitCodeError('El codigo de unidad no puede estar vacio.');
    }
    if (limpio.length > UnitCode.MAX) {
      throw new InvalidUnitCodeError(
        `El codigo de unidad no puede superar ${UnitCode.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    if (!UnitCode.PATTERN.test(limpio)) {
      throw new InvalidUnitCodeError(
        'El codigo de unidad solo puede contener letras mayusculas y digitos.',
      );
    }
    return new UnitCode(limpio);
  }

  /** Se guarda ya en mayusculas; la clave es identica al valor almacenado. */
  get comparisonKey(): string {
    return this.value;
  }

  equals(otro: UnitCode): boolean {
    return this.comparisonKey === otro.comparisonKey;
  }

  toString(): string {
    return this.value;
  }
}
