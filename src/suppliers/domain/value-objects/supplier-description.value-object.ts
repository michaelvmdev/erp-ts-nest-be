import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidSupplierDescriptionError extends InvalidInputError {
  readonly code = 'INVALID_SUPPLIER_DESCRIPTION';

  constructor(message: string) {
    super(message);
  }
}

/** supplier_description varchar(150) NOT NULL */
export class SupplierDescription {
  static readonly MAX = 150;

  private constructor(readonly value: string) {}

  static of(valor: string): SupplierDescription {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidSupplierDescriptionError(
        'La razon social del proveedor no puede estar vacia.',
      );
    }
    if (limpio.length > SupplierDescription.MAX) {
      throw new InvalidSupplierDescriptionError(
        `La razon social del proveedor no puede superar ${SupplierDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new SupplierDescription(limpio);
  }

  toString(): string {
    return this.value;
  }
}
