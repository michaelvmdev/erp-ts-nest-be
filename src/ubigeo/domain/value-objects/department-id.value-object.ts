import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidDepartmentIdError extends InvalidInputError {
  readonly code = 'INVALID_DEPARTMENT_ID';

  constructor(valor: unknown) {
    super(
      `El codigo de departamento debe tener 2 digitos, se recibio "${String(valor)}".`,
    );
  }
}

/**
 * Identidad de un departamento del ubigeo (codigo INEI de 2 digitos).
 *
 * Es un string y no un number, a diferencia de DocumentTypeId: los codigos
 * llevan ceros a la izquierda ("01" = Amazonas) que un entero perderia.
 */
export class DepartmentId {
  private constructor(readonly value: string) {}

  static of(valor: string): DepartmentId {
    const limpio = valor?.trim() ?? '';
    if (!/^[0-9]{2}$/.test(limpio)) {
      throw new InvalidDepartmentIdError(valor);
    }
    return new DepartmentId(limpio);
  }

  equals(otro: DepartmentId): boolean {
    return otro.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
