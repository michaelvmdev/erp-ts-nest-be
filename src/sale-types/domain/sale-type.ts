import { InvalidInputError } from '../../shared/domain/domain.error';
import { SaleTypeId } from './sale-type-id.value-object';

export class InvalidSaleTypeError extends InvalidInputError {
  readonly code = 'INVALID_SALE_TYPE';

  constructor(message: string) {
    super(message);
  }
}

export interface SaleTypeSnapshot {
  readonly id: number;
  readonly description: string;
  readonly code: string;
}

/**
 * Raiz del agregado Tipo de comprobante (Factura, Boleta).
 *
 * Solo expone `rehydrate`: el catalogo se siembra por SQL y no hay alta por API.
 *
 * El agregado deja fuera el correlativo a proposito. No es un atributo del
 * catalogo sino el estado de una serie de numeracion, que solo se toca al emitir
 * una venta y con un incremento atomico. Modelarlo aqui invitaria a leerlo y
 * escribirlo desde este modulo, y esa es precisamente la carrera que el modulo de
 * ventas evita haciendolo en una unica sentencia.
 */
export class SaleType {
  static readonly MAX_DESCRIPCION = 20;

  private constructor(
    private readonly _id: SaleTypeId,
    private readonly _description: string,
    private readonly _code: string,
  ) {}

  static rehydrate(params: {
    id: SaleTypeId;
    description: string;
    code: string;
  }): SaleType {
    const descripcion = params.description?.trim() ?? '';
    // char(3) en PostgreSQL se rellena con espacios, asi que se recorta.
    const codigo = params.code?.trim() ?? '';

    if (descripcion.length === 0) {
      throw new InvalidSaleTypeError(
        'La descripcion del tipo de comprobante no puede estar vacia.',
      );
    }
    if (descripcion.length > SaleType.MAX_DESCRIPCION) {
      throw new InvalidSaleTypeError(
        `La descripcion no puede superar ${SaleType.MAX_DESCRIPCION} caracteres, tiene ${descripcion.length}.`,
      );
    }
    if (!/^[A-Z]{3}$/.test(codigo)) {
      throw new InvalidSaleTypeError(
        `El codigo debe ser tres letras mayusculas, se recibio "${params.code}".`,
      );
    }

    return new SaleType(params.id, descripcion, codigo);
  }

  get id(): SaleTypeId {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  /** Prefijo del numero de comprobante: "FAC-0000000001". */
  get code(): string {
    return this._code;
  }

  toSnapshot(): SaleTypeSnapshot {
    return {
      id: this._id.value,
      description: this._description,
      code: this._code,
    };
  }
}
