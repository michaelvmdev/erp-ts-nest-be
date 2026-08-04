import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidCategoryDescriptionError extends InvalidInputError {
  readonly code = 'INVALID_CATEGORY_DESCRIPTION';

  constructor(message: string) {
    super(message);
  }
}

/** category_description varchar(100) NOT NULL */
export class CategoryDescription {
  static readonly MAX = 100;

  private constructor(readonly value: string) {}

  static of(valor: string): CategoryDescription {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidCategoryDescriptionError(
        'La descripcion de la categoria no puede estar vacia.',
      );
    }
    if (limpio.length > CategoryDescription.MAX) {
      throw new InvalidCategoryDescriptionError(
        `La descripcion de la categoria no puede superar ${CategoryDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new CategoryDescription(limpio);
  }

  /**
   * Clave de comparacion para detectar duplicados.
   *
   * "Audio" y "audio " son la misma categoria aunque difieran como cadenas, asi
   * que la unicidad se evalua sobre esta forma normalizada y no sobre el texto
   * tal cual lo escribio el usuario.
   */
  get comparisonKey(): string {
    return this.value.trim().toLowerCase();
  }

  equals(otra: CategoryDescription): boolean {
    return this.comparisonKey === otra.comparisonKey;
  }

  toString(): string {
    return this.value;
  }
}
