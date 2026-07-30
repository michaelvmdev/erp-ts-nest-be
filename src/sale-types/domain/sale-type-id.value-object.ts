import { InvalidInputError } from '../../shared/domain/domain.error';

export class InvalidSaleTypeIdError extends InvalidInputError {
  readonly code = 'INVALID_SALE_TYPE_ID';

  constructor(valor: unknown) {
    super(
      `El id de tipo de comprobante debe ser un entero positivo, se recibio "${String(valor)}".`,
    );
  }
}

/**
 * Identidad del agregado Tipo de comprobante.
 *
 * Entero y no UUID, igual que en tipos de documento: es un catalogo fijo y corto
 * cuyos valores forman parte del contrato, y el backend puede referirse al tipo 1
 * sin consultar la tabla.
 */
export class SaleTypeId {
  private constructor(readonly value: number) {}

  static of(valor: number): SaleTypeId {
    if (!Number.isInteger(valor) || valor < 1) {
      throw new InvalidSaleTypeIdError(valor);
    }
    return new SaleTypeId(valor);
  }

  equals(otro: SaleTypeId): boolean {
    return otro.value === this.value;
  }

  toString(): string {
    return String(this.value);
  }
}
