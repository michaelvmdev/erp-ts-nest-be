import { InvalidUbigeoDataError } from './ubigeo.errors';
import { DepartmentId } from './value-objects/department-id.value-object';

export interface DepartmentSnapshot {
  readonly id: string;
  readonly description: string;
}

/**
 * Departamento del ubigeo (primer nivel: Lima, Cusco…).
 *
 * Solo expone `rehydrate` y no `create`: el padron es de solo lectura y se
 * siembra desde db/db.sql. No hay alta por API, y que el dominio no ofrezca un
 * constructor de creacion lo deja explicito en el codigo.
 */
export class Department {
  static readonly MAX_DESCRIPCION = 100;

  private constructor(
    private readonly _id: DepartmentId,
    private readonly _description: string,
  ) {}

  static rehydrate(params: {
    id: DepartmentId;
    description: string;
  }): Department {
    const limpio = params.description?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidUbigeoDataError(
        `El departamento ${params.id.value} no tiene descripcion.`,
      );
    }
    if (limpio.length > Department.MAX_DESCRIPCION) {
      throw new InvalidUbigeoDataError(
        `La descripcion del departamento ${params.id.value} supera ${Department.MAX_DESCRIPCION} caracteres.`,
      );
    }

    return new Department(params.id, limpio);
  }

  get id(): DepartmentId {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  toSnapshot(): DepartmentSnapshot {
    return { id: this._id.value, description: this._description };
  }
}
