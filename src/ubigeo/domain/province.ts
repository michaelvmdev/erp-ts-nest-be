import { InvalidUbigeoDataError } from './ubigeo.errors';
import { DepartmentId } from './value-objects/department-id.value-object';
import { ProvinceId } from './value-objects/province-id.value-object';

export interface ProvinceSnapshot {
  readonly id: string;
  readonly departmentId: string;
  readonly description: string;
}

/**
 * Provincia del ubigeo (segundo nivel).
 *
 * Solo `rehydrate`. Ademas de la descripcion, comprueba que el codigo de
 * provincia empiece con el de su departamento: es la misma coherencia que
 * garantizan el CHECK de prefijo y la clave foranea del esquema, verificada al
 * leer para no propagar una jerarquia rota si alguna vez dejaran de encajar.
 */
export class Province {
  static readonly MAX_DESCRIPCION = 100;

  private constructor(
    private readonly _id: ProvinceId,
    private readonly _departmentId: DepartmentId,
    private readonly _description: string,
  ) {}

  static rehydrate(params: {
    id: ProvinceId;
    departmentId: DepartmentId;
    description: string;
  }): Province {
    const limpio = params.description?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidUbigeoDataError(
        `La provincia ${params.id.value} no tiene descripcion.`,
      );
    }
    if (limpio.length > Province.MAX_DESCRIPCION) {
      throw new InvalidUbigeoDataError(
        `La descripcion de la provincia ${params.id.value} supera ${Province.MAX_DESCRIPCION} caracteres.`,
      );
    }
    if (params.id.departmentId !== params.departmentId.value) {
      throw new InvalidUbigeoDataError(
        `La provincia ${params.id.value} no pertenece al departamento ${params.departmentId.value}.`,
      );
    }

    return new Province(params.id, params.departmentId, limpio);
  }

  get id(): ProvinceId {
    return this._id;
  }

  get departmentId(): DepartmentId {
    return this._departmentId;
  }

  get description(): string {
    return this._description;
  }

  toSnapshot(): ProvinceSnapshot {
    return {
      id: this._id.value,
      departmentId: this._departmentId.value,
      description: this._description,
    };
  }
}
