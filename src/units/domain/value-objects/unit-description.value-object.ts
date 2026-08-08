import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidUnitDescriptionError extends InvalidInputError {
  readonly code = 'INVALID_UNIT_DESCRIPTION';

  constructor(message: string) {
    super(message);
  }
}

/** unit_description varchar(100) NOT NULL */
export class UnitDescription {
  static readonly MAX = 100;

  private constructor(readonly value: string) {}

  static of(valor: string): UnitDescription {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidUnitDescriptionError(
        'La descripcion de la unidad no puede estar vacia.',
      );
    }
    if (limpio.length > UnitDescription.MAX) {
      throw new InvalidUnitDescriptionError(
        `La descripcion de la unidad no puede superar ${UnitDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new UnitDescription(limpio);
  }

  toString(): string {
    return this.value;
  }
}
