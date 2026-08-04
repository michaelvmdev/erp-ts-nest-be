import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidProvinceIdError extends InvalidInputError {
  readonly code = 'INVALID_PROVINCE_ID';

  constructor(valor: unknown) {
    super(
      `El codigo de provincia debe tener 4 digitos, se recibio "${String(valor)}".`,
    );
  }
}

/**
 * Identidad de una provincia del ubigeo (codigo INEI de 4 digitos).
 *
 * Los 2 primeros digitos son el codigo del departamento al que pertenece, tal
 * como lo garantiza el CHECK de prefijo del esquema. `departmentId` lo deriva
 * de ahi en vez de recibirlo por separado.
 */
export class ProvinceId {
  private constructor(readonly value: string) {}

  static of(valor: string): ProvinceId {
    const limpio = valor?.trim() ?? '';
    if (!/^[0-9]{4}$/.test(limpio)) {
      throw new InvalidProvinceIdError(valor);
    }
    return new ProvinceId(limpio);
  }

  /** Codigo del departamento al que pertenece: los 2 primeros digitos. */
  get departmentId(): string {
    return this.value.slice(0, 2);
  }

  equals(otro: ProvinceId): boolean {
    return otro.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
