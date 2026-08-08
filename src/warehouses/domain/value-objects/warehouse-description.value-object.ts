import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidWarehouseDescriptionError extends InvalidInputError {
  readonly code = 'INVALID_WAREHOUSE_DESCRIPTION';

  constructor(message: string) {
    super(message);
  }
}

/** warehouse_description varchar(200) NOT NULL */
export class WarehouseDescription {
  static readonly MAX = 200;

  private constructor(readonly value: string) {}

  static of(valor: string): WarehouseDescription {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidWarehouseDescriptionError(
        'La descripcion del almacen no puede estar vacia.',
      );
    }
    if (limpio.length > WarehouseDescription.MAX) {
      throw new InvalidWarehouseDescriptionError(
        `La descripcion del almacen no puede superar ${WarehouseDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new WarehouseDescription(limpio);
  }

  toString(): string {
    return this.value;
  }
}
