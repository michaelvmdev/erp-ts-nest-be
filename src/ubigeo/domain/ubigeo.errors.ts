import {
  InvalidInputError,
  NotFoundError,
} from '../../shared/domain/domain.error';

/**
 * Una fila del ubigeo llego incoherente desde la base.
 *
 * No deberia ocurrir: el padron es de solo lectura y el esquema tiene los CHECK
 * de prefijo y las claves foraneas que lo impiden. Es una guarda de integridad
 * al rehidratar —mejor enterarse al leer que propagar una jerarquia rota.
 */
export class InvalidUbigeoDataError extends InvalidInputError {
  readonly code = 'INVALID_UBIGEO_DATA';

  constructor(message: string) {
    super(message);
  }
}

export class DepartmentNotFoundError extends NotFoundError {
  readonly code = 'DEPARTMENT_NOT_FOUND';

  constructor(departmentId: string) {
    super(`No existe un departamento con codigo ${departmentId}.`);
  }
}

export class ProvinceNotFoundError extends NotFoundError {
  readonly code = 'PROVINCE_NOT_FOUND';

  constructor(provinceId: string) {
    super(`No existe una provincia con codigo ${provinceId}.`);
  }
}
