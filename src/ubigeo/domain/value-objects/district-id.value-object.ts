import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidDistrictIdError extends InvalidInputError {
  readonly code = 'INVALID_DISTRICT_ID';

  constructor(valor: unknown) {
    super(
      `El codigo de distrito debe tener 6 digitos, se recibio "${String(valor)}".`,
    );
  }
}

/**
 * Identidad de un distrito del ubigeo (codigo INEI de 6 digitos).
 *
 * Los 4 primeros digitos son el codigo de la provincia a la que pertenece, tal
 * como lo garantiza el CHECK de prefijo del esquema.
 */
export class DistrictId {
  private constructor(readonly value: string) {}

  static of(valor: string): DistrictId {
    const limpio = valor?.trim() ?? '';
    if (!/^[0-9]{6}$/.test(limpio)) {
      throw new InvalidDistrictIdError(valor);
    }
    return new DistrictId(limpio);
  }

  /** Codigo de la provincia a la que pertenece: los 4 primeros digitos. */
  get provinceId(): string {
    return this.value.slice(0, 4);
  }

  equals(otro: DistrictId): boolean {
    return otro.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
