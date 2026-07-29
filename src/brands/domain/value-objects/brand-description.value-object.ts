import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidBrandDescriptionError extends InvalidInputError {
  readonly code = 'INVALID_BRAND_DESCRIPTION';

  constructor(message: string) {
    super(message);
  }
}

/** brand_description varchar(50) NOT NULL */
export class BrandDescription {
  static readonly MAX = 50;

  private constructor(readonly value: string) {}

  static of(valor: string): BrandDescription {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidBrandDescriptionError(
        'La descripcion de la marca no puede estar vacia.',
      );
    }
    if (limpio.length > BrandDescription.MAX) {
      throw new InvalidBrandDescriptionError(
        `La descripcion de la marca no puede superar ${BrandDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new BrandDescription(limpio);
  }

  /**
   * Clave de comparacion para detectar duplicados.
   *
   * "Apple" y "apple " son la misma marca aunque difieran como cadenas, asi que
   * la unicidad se evalua sobre esta forma normalizada y no sobre el texto tal
   * cual lo escribio el usuario.
   */
  get comparisonKey(): string {
    return this.value.trim().toLowerCase();
  }

  equals(otra: BrandDescription): boolean {
    return this.comparisonKey === otra.comparisonKey;
  }

  toString(): string {
    return this.value;
  }
}
