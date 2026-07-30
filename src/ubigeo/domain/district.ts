import { InvalidUbigeoDataError } from './ubigeo.errors';
import { DistrictId } from './value-objects/district-id.value-object';
import { ProvinceId } from './value-objects/province-id.value-object';

export interface DistrictSnapshot {
  readonly id: string;
  readonly provinceId: string;
  readonly description: string;
}

/**
 * Distrito del ubigeo (tercer nivel, el que se envia al registrar una venta).
 *
 * Solo `rehydrate`, con la misma comprobacion de coherencia que Province: el
 * codigo de distrito debe empezar con el de su provincia.
 */
export class District {
  static readonly MAX_DESCRIPCION = 100;

  private constructor(
    private readonly _id: DistrictId,
    private readonly _provinceId: ProvinceId,
    private readonly _description: string,
  ) {}

  static rehydrate(params: {
    id: DistrictId;
    provinceId: ProvinceId;
    description: string;
  }): District {
    const limpio = params.description?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidUbigeoDataError(
        `El distrito ${params.id.value} no tiene descripcion.`,
      );
    }
    if (limpio.length > District.MAX_DESCRIPCION) {
      throw new InvalidUbigeoDataError(
        `La descripcion del distrito ${params.id.value} supera ${District.MAX_DESCRIPCION} caracteres.`,
      );
    }
    if (params.id.provinceId !== params.provinceId.value) {
      throw new InvalidUbigeoDataError(
        `El distrito ${params.id.value} no pertenece a la provincia ${params.provinceId.value}.`,
      );
    }

    return new District(params.id, params.provinceId, limpio);
  }

  get id(): DistrictId {
    return this._id;
  }

  get provinceId(): ProvinceId {
    return this._provinceId;
  }

  get description(): string {
    return this._description;
  }

  toSnapshot(): DistrictSnapshot {
    return {
      id: this._id.value,
      provinceId: this._provinceId.value,
      description: this._description,
    };
  }
}
