import { InvalidInputError } from '../../../shared/domain/domain.error';
import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class SaleId extends UuidValueObject {
  static of(valor: string): SaleId {
    return new SaleId(this.ensureValid('El id de venta', valor));
  }
}

export class InvalidSaleNumberError extends InvalidInputError {
  readonly code = 'INVALID_SALE_NUMBER';

  constructor(message: string) {
    super(message);
  }
}

const PATRON = /^([A-Z]{3})-([0-9]{10})$/;

/**
 * Numero de comprobante: el codigo del tipo, un guion y el correlativo de diez
 * digitos. Por ejemplo "FAC-0000000001".
 *
 * Es la identidad fiscal del documento y no se elige: lo asigna el backend
 * consumiendo el correlativo del tipo. Por eso no hay un `of` que acepte
 * cualquier texto desde la API, solo `emitir` a partir de un correlativo ya
 * reservado y `rehydrate` para lo que viene de la base.
 *
 * Los ceros a la izquierda son significativos: forman parte del numero impreso.
 */
export class SaleNumber {
  static readonly DIGITOS = 10;
  static readonly MAX_CORRELATIVO = 9_999_999_999;

  private constructor(
    readonly code: string,
    readonly correlative: number,
  ) {}

  static emitir(code: string, correlative: number): SaleNumber {
    if (!/^[A-Z]{3}$/.test(code)) {
      throw new InvalidSaleNumberError(
        `El codigo de comprobante debe ser tres letras mayusculas, se recibio "${code}".`,
      );
    }
    if (!Number.isInteger(correlative) || correlative < 1) {
      throw new InvalidSaleNumberError(
        `El correlativo debe ser un entero mayor o igual a 1, se recibio ${correlative}.`,
      );
    }
    if (correlative > SaleNumber.MAX_CORRELATIVO) {
      throw new InvalidSaleNumberError(
        `El correlativo agoto los ${SaleNumber.DIGITOS} digitos de la serie ${code}.`,
      );
    }
    return new SaleNumber(code, correlative);
  }

  static rehydrate(valor: string): SaleNumber {
    const m = PATRON.exec(valor?.trim() ?? '');
    if (!m) {
      throw new InvalidSaleNumberError(
        `El numero de comprobante debe tener la forma "FAC-0000000001", se recibio "${valor}".`,
      );
    }
    return new SaleNumber(m[1], Number(m[2]));
  }

  get value(): string {
    return `${this.code}-${String(this.correlative).padStart(SaleNumber.DIGITOS, '0')}`;
  }

  toString(): string {
    return this.value;
  }
}
